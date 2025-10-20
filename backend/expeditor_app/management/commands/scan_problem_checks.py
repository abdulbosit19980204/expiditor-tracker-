"""
Management command to scan for problem checks.

This command identifies checks with data quality issues such as
missing coordinates, expeditor information, or other problems.
"""

from django.core.management.base import BaseCommand, CommandError
from expeditor_app.models import Check, ProblemCheck
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Scan for checks with data quality issues'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--issue-code',
            type=str,
            help='Scan for specific issue code only',
            choices=['NO_COORDS', 'NO_EXPEDITOR', 'NO_TOTAL_SUM', 'DETAIL_MISSING']
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be detected without creating records',
        )
        parser.add_argument(
            '--resolve-existing',
            action='store_true',
            help='Mark existing problems as resolved if they are now fixed',
        )
    
    def handle(self, *args, **options):
        issue_code = options.get('issue_code')
        dry_run = options.get('dry_run', False)
        resolve_existing = options.get('resolve_existing', False)
        
        self.stdout.write(
            self.style.SUCCESS('Starting problem check scan...')
        )
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No problem records will be created'))
        
        # Define issue scanners
        scanners = {
            'NO_COORDS': self._scan_missing_coordinates,
            'NO_EXPEDITOR': self._scan_missing_expeditor,
            'NO_TOTAL_SUM': self._scan_missing_total_sum,
            'DETAIL_MISSING': self._scan_missing_details,
        }
        
        # Run specific scanner or all scanners
        if issue_code:
            scanners = {issue_code: scanners[issue_code]}
        
        total_problems = 0
        
        for code, scanner_func in scanners.items():
            try:
                problems = scanner_func(dry_run)
                total_problems += problems
                
                if problems > 0:
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Found {problems} checks with {code}')
                    )
                else:
                    self.stdout.write(f'  No problems found for {code}')
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to scan {code}: {str(e)}')
                )
                logger.error(f'Problem scan failed for {code}: {str(e)}')
        
        # Resolve existing problems if requested
        if resolve_existing:
            resolved_count = self._resolve_existing_problems()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Resolved {resolved_count} existing problems')
            )
        
        # Summary
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(f'Problem scan completed: {total_problems} problems found')
        )
    
    def _scan_missing_coordinates(self, dry_run=False):
        """Scan for checks missing GPS coordinates."""
        checks = Check.objects.filter(
            check_lat__isnull=True,
            check_lon__isnull=True
        )
        
        count = 0
        for check in checks:
            if not dry_run:
                ProblemCheck.objects.update_or_create(
                    check_id=check.check_id,
                    issue_code='NO_COORDS',
                    defaults={
                        'issue_message': 'Missing GPS coordinates',
                        'resolved': False,
                    }
                )
            count += 1
        
        return count
    
    def _scan_missing_expeditor(self, dry_run=False):
        """Scan for checks missing expeditor information."""
        checks = Check.objects.filter(
            ekispiditor__isnull=True
        )
        
        count = 0
        for check in checks:
            if not dry_run:
                ProblemCheck.objects.update_or_create(
                    check_id=check.check_id,
                    issue_code='NO_EXPEDITOR',
                    defaults={
                        'issue_message': 'Missing expeditor information',
                        'resolved': False,
                    }
                )
            count += 1
        
        return count
    
    def _scan_missing_total_sum(self, dry_run=False):
        """Scan for checks missing total sum."""
        from expeditor_app.models import CheckDetail
        
        # Find checks without details or with null total_sum
        checks_without_details = Check.objects.exclude(
            check_id__in=CheckDetail.objects.values_list('check_id', flat=True)
        )
        
        checks_with_null_sum = Check.objects.filter(
            check_id__in=CheckDetail.objects.filter(total_sum__isnull=True).values_list('check_id', flat=True)
        )
        
        count = 0
        for check in checks_without_details:
            if not dry_run:
                ProblemCheck.objects.update_or_create(
                    check_id=check.check_id,
                    issue_code='NO_TOTAL_SUM',
                    defaults={
                        'issue_message': 'Missing check details or total sum',
                        'resolved': False,
                    }
                )
            count += 1
        
        for check in checks_with_null_sum:
            if not dry_run:
                ProblemCheck.objects.update_or_create(
                    check_id=check.check_id,
                    issue_code='NO_TOTAL_SUM',
                    defaults={
                        'issue_message': 'Total sum is null',
                        'resolved': False,
                    }
                )
            count += 1
        
        return count
    
    def _scan_missing_details(self, dry_run=False):
        """Scan for checks missing detail records."""
        from expeditor_app.models import CheckDetail
        
        checks_without_details = Check.objects.exclude(
            check_id__in=CheckDetail.objects.values_list('check_id', flat=True)
        )
        
        count = 0
        for check in checks_without_details:
            if not dry_run:
                ProblemCheck.objects.update_or_create(
                    check_id=check.check_id,
                    issue_code='DETAIL_MISSING',
                    defaults={
                        'issue_message': 'Check detail record missing',
                        'resolved': False,
                    }
                )
            count += 1
        
        return count
    
    def _resolve_existing_problems(self):
        """Mark existing problems as resolved if they are now fixed."""
        resolved_count = 0
        
        # Resolve NO_COORDS if coordinates now exist
        no_coords_problems = ProblemCheck.objects.filter(
            issue_code='NO_COORDS',
            resolved=False
        )
        
        for problem in no_coords_problems:
            try:
                check = Check.objects.get(check_id=problem.check_id)
                if check.check_lat is not None and check.check_lon is not None:
                    problem.resolved = True
                    problem.save()
                    resolved_count += 1
            except Check.DoesNotExist:
                # Check no longer exists, mark as resolved
                problem.resolved = True
                problem.save()
                resolved_count += 1
        
        # Resolve NO_EXPEDITOR if expeditor now exists
        no_expeditor_problems = ProblemCheck.objects.filter(
            issue_code='NO_EXPEDITOR',
            resolved=False
        )
        
        for problem in no_expeditor_problems:
            try:
                check = Check.objects.get(check_id=problem.check_id)
                if check.ekispiditor:
                    problem.resolved = True
                    problem.save()
                    resolved_count += 1
            except Check.DoesNotExist:
                problem.resolved = True
                problem.save()
                resolved_count += 1
        
        return resolved_count
