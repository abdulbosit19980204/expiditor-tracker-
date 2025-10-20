from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from expeditor_app.models import Check, CheckAnalytics
import math


class Command(BaseCommand):
    help = "Analyze check patterns within time and distance windows to identify active expiditors"

    def add_arguments(self, parser):
        parser.add_argument(
            '--time-window-minutes',
            type=int,
            default=10,
            help='Time window in minutes to analyze (default: 10)'
        )
        parser.add_argument(
            '--distance-meters',
            type=int,
            default=15,
            help='Distance radius in meters to analyze (default: 15)'
        )
        parser.add_argument(
            '--lookback-hours',
            type=int,
            default=24,
            help='How many hours back to analyze (default: 24)'
        )

    def handle(self, *args, **options):
        time_window_minutes = options['time_window_minutes']
        distance_meters = options['distance_meters']
        lookback_hours = options['lookback_hours']
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Starting check pattern analysis: {time_window_minutes}min windows, "
                f"{distance_meters}m radius, {lookback_hours}h lookback"
            )
        )
        
        # Get checks from the last lookback_hours that have coordinates
        cutoff_time = timezone.now() - timedelta(hours=lookback_hours)
        checks_with_coords = Check.objects.filter(
            yetkazilgan_vaqti__gte=cutoff_time,
            check_lat__isnull=False,
            check_lon__isnull=False,
            ekispiditor__isnull=False
        ).order_by('yetkazilgan_vaqti')
        
        if not checks_with_coords.exists():
            self.stdout.write(
                self.style.WARNING("No checks found with coordinates in the specified time range")
            )
            return
        
        self.stdout.write(f"Found {checks_with_coords.count()} checks to analyze")
        
        # Group checks by time windows
        time_windows = self._create_time_windows(
            checks_with_coords, time_window_minutes, lookback_hours
        )
        
        analytics_created = 0
        for window_start, window_end in time_windows:
            window_checks = checks_with_coords.filter(
                yetkazilgan_vaqti__gte=window_start,
                yetkazilgan_vaqti__lt=window_end
            )
            
            if window_checks.count() < 2:  # Need at least 2 checks to analyze patterns
                continue
                
            # Analyze geographic clusters within this time window
            clusters = self._find_geographic_clusters(window_checks, distance_meters)
            
            for cluster_center_lat, cluster_center_lon, cluster_checks in clusters:
                if len(cluster_checks) < 2:
                    continue
                    
                analytics_data = self._calculate_cluster_analytics(
                    cluster_checks, window_start, window_end, 
                    time_window_minutes, cluster_center_lat, cluster_center_lon, 
                    distance_meters
                )
                
                # Create or update analytics record
                analytics, created = CheckAnalytics.objects.update_or_create(
                    window_start=window_start,
                    window_end=window_end,
                    center_lat=cluster_center_lat,
                    center_lon=cluster_center_lon,
                    radius_meters=distance_meters,
                    defaults=analytics_data
                )
                
                if created:
                    analytics_created += 1
                    self.stdout.write(
                        f"Created analytics for {window_start.strftime('%H:%M')}-{window_end.strftime('%H:%M')} "
                        f"at ({cluster_center_lat:.4f}, {cluster_center_lon:.4f}): "
                        f"{analytics_data['total_checks']} checks, "
                        f"top expiditor: {analytics_data['most_active_expiditor']} "
                        f"({analytics_data['most_active_count']} checks)"
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f"Analysis complete. Created {analytics_created} new analytics records.")
        )

    def _create_time_windows(self, checks, window_minutes, lookback_hours):
        """Create overlapping time windows for analysis."""
        windows = []
        start_time = timezone.now() - timedelta(hours=lookback_hours)
        end_time = timezone.now()
        
        current_time = start_time
        while current_time + timedelta(minutes=window_minutes) <= end_time:
            window_start = current_time
            window_end = current_time + timedelta(minutes=window_minutes)
            windows.append((window_start, window_end))
            # Move window by half the window size for overlapping analysis
            current_time += timedelta(minutes=window_minutes // 2)
        
        return windows

    def _find_geographic_clusters(self, checks, distance_meters):
        """Find geographic clusters of checks within the distance threshold."""
        clusters = []
        processed_checks = set()
        
        for check in checks:
            if check.id in processed_checks:
                continue
                
            # Start a new cluster with this check
            cluster_checks = [check]
            processed_checks.add(check.id)
            
            # Find all checks within distance_meters of this check
            for other_check in checks:
                if other_check.id in processed_checks:
                    continue
                    
                distance = CheckAnalytics.calculate_distance(
                    check.check_lat, check.check_lon,
                    other_check.check_lat, other_check.check_lon
                )
                
                if distance <= distance_meters:
                    cluster_checks.append(other_check)
                    processed_checks.add(other_check.id)
            
            # Calculate cluster center
            if cluster_checks:
                center_lat = sum(c.check_lat for c in cluster_checks) / len(cluster_checks)
                center_lon = sum(c.check_lon for c in cluster_checks) / len(cluster_checks)
                clusters.append((center_lat, center_lon, cluster_checks))
        
        return clusters

    def _calculate_cluster_analytics(self, cluster_checks, window_start, window_end, 
                                   window_duration_minutes, center_lat, center_lon, radius_meters):
        """Calculate analytics for a cluster of checks."""
        # Count checks per expiditor
        expiditor_counts = {}
        check_ids = []
        check_details = []
        
        for check in cluster_checks:
            check_ids.append(check.id)
            check_details.append({
                'id': check.id,
                'time': check.yetkazilgan_vaqti.isoformat(),
                'lat': float(check.check_lat) if check.check_lat else None,
                'lng': float(check.check_lon) if check.check_lon else None,
                'expeditor': check.ekispiditor or 'Unknown',
                'status': getattr(check, 'status', '') or '',
                'address': getattr(check, 'address', '') or ''
            })
            
            expiditor = check.ekispiditor
            if expiditor:
                expiditor_counts[expiditor] = expiditor_counts.get(expiditor, 0) + 1
        
        # Find most active expiditor
        most_active_expiditor = None
        most_active_count = 0
        if expiditor_counts:
            most_active_expiditor = max(expiditor_counts, key=expiditor_counts.get)
            most_active_count = expiditor_counts[most_active_expiditor]
        
        total_checks = len(cluster_checks)
        unique_expiditors = len(expiditor_counts)
        avg_checks_per_expiditor = total_checks / unique_expiditors if unique_expiditors > 0 else 0
        
        return {
            'window_duration_minutes': window_duration_minutes,
            'total_checks': total_checks,
            'unique_expiditors': unique_expiditors,
            'most_active_expiditor': most_active_expiditor,
            'most_active_count': most_active_count,
            'avg_checks_per_expiditor': round(avg_checks_per_expiditor, 2),
            'check_ids': check_ids,
            'check_details': check_details,
        }
