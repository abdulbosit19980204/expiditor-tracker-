# Check Analytics System

## Overview

The Check Analytics System automatically analyzes check-in patterns to identify the most active expiditors within specific time windows and geographic areas. This system helps track which expiditors are working most efficiently in concentrated areas.

## Features

- **Time-based Analysis**: Groups checks within configurable time windows (default: 10 minutes)
- **Geographic Clustering**: Identifies checks within specific distance radius (default: 15 meters)
- **Expiditor Activity Tracking**: Determines the most active expiditor in each time/area cluster
- **Automatic Scheduling**: Runs automatically every 30 minutes via scheduled tasks
- **Django Admin Integration**: Full admin interface for viewing and managing analytics data

## New Models

### CheckAnalytics

Stores aggregated analytics data for each time window and geographic cluster:

- **Time Information**: Window start/end, duration
- **Geographic Information**: Center coordinates, radius
- **Statistics**: Total checks, unique expiditors, most active expiditor, averages

## Management Commands

### analyze_check_patterns

Analyzes check patterns and creates analytics records.

```bash
python manage.py analyze_check_patterns [options]
```

Options:
- `--time-window-minutes`: Time window in minutes (default: 10)
- `--distance-meters`: Distance radius in meters (default: 15) 
- `--lookback-hours`: How many hours back to analyze (default: 24)

### setup_analytics_task

Sets up the default scheduled task for automatic analytics.

```bash
python manage.py setup_analytics_task
```

## Scheduled Tasks

The system includes a new scheduled task type: `TASK_ANALYZE_PATTERNS`

- **Default Schedule**: Every 30 minutes
- **Configurable Parameters**: Time window, distance, lookback period
- **Automatic Execution**: Runs via `run_scheduled_tasks` command

## Django Admin

The analytics data is fully integrated into Django Admin:

- **CheckAnalytics**: View all analytics records with filtering and search
- **Scheduled Tasks**: Manage the analytics task scheduling
- **Task Runs**: Monitor analytics task execution history

## Usage Examples

### Manual Analysis

```bash
# Analyze last 48 hours with 15-minute windows and 20-meter radius
python manage.py analyze_check_patterns --time-window-minutes 15 --distance-meters 20 --lookback-hours 48

# Quick analysis of recent data
python manage.py analyze_check_patterns --lookback-hours 1
```

### Scheduled Execution

```bash
# Run all scheduled tasks (including analytics)
python manage.py run_scheduled_tasks
```

## Configuration

### Task Parameters

The analytics task can be configured in Django Admin under "Settings — Scheduled Tasks":

```json
{
    "time_window_minutes": 10,
    "distance_meters": 15,
    "lookback_hours": 24
}
```

### Customization

- **Time Windows**: Adjust based on your business needs (5-60 minutes recommended)
- **Distance Radius**: Adjust based on your delivery density (10-50 meters typical)
- **Lookback Period**: Adjust based on data volume and analysis needs (1-168 hours)

## Data Insights

The analytics system provides insights such as:

- Which expiditors are most active in specific areas
- Time periods with highest delivery density
- Geographic hotspots for deliveries
- Efficiency patterns by time and location

## Technical Details

- **Distance Calculation**: Uses Haversine formula for accurate geographic distance
- **Performance**: Optimized for large datasets with indexed queries
- **Non-intrusive**: Does not affect existing check processing or data
- **Scalable**: Designed to handle high-volume check data efficiently

## Monitoring

Monitor the analytics system through:

1. **Django Admin**: CheckAnalytics records and task execution
2. **Task Runs**: View execution history and status
3. **Logs**: Monitor for any processing errors or issues

The system is designed to run continuously without manual intervention while providing valuable insights into delivery patterns and expiditor performance.
