"""
Serializers for Analytics API Views
"""

from rest_framework import serializers
from typing import Dict, List, Any


class DailySalesDataSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_checks = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    delivered_checks = serializers.IntegerField()
    failed_checks = serializers.IntegerField()
    pending_checks = serializers.IntegerField()


class DailySalesSummarySerializer(serializers.Serializer):
    daily_data = DailySalesDataSerializer(many=True)
    summary = serializers.DictField()


class ExpeditorPerformanceSerializer(serializers.Serializer):
    ekispiditor = serializers.CharField()
    total_checks = serializers.IntegerField()
    delivered_checks = serializers.IntegerField()
    failed_checks = serializers.IntegerField()
    pending_checks = serializers.IntegerField()
    success_rate = serializers.FloatField()
    total_revenue = serializers.FloatField()


class ExpeditorPerformanceSummarySerializer(serializers.Serializer):
    expeditor_performance = ExpeditorPerformanceSerializer(many=True)
    summary = serializers.DictField()


class PaymentDistributionSerializer(serializers.Serializer):
    method = serializers.CharField()
    amount = serializers.FloatField()
    percentage = serializers.FloatField()


class PaymentDistributionSummarySerializer(serializers.Serializer):
    payment_distribution = PaymentDistributionSerializer(many=True)
    summary = serializers.DictField()


class ProjectStatisticsSerializer(serializers.Serializer):
    project = serializers.CharField()
    total_checks = serializers.IntegerField()
    delivered_checks = serializers.IntegerField()
    failed_checks = serializers.IntegerField()
    pending_checks = serializers.IntegerField()
    unique_expeditors = serializers.IntegerField()
    total_revenue = serializers.FloatField()


class ProjectStatisticsSummarySerializer(serializers.Serializer):
    project_statistics = ProjectStatisticsSerializer(many=True)
    summary = serializers.DictField()


class StatusDistributionSerializer(serializers.Serializer):
    status = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class StatusDistributionSummarySerializer(serializers.Serializer):
    status_distribution = StatusDistributionSerializer(many=True)
    summary = serializers.DictField()


class CityStatisticsSerializer(serializers.Serializer):
    city = serializers.CharField()
    total_checks = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    unique_expeditors = serializers.IntegerField()


class SkladStatisticsSerializer(serializers.Serializer):
    sklad = serializers.CharField()
    total_checks = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    unique_expeditors = serializers.IntegerField()


class FilialStatisticsSerializer(serializers.Serializer):
    ekispiditor__filial__filial_name = serializers.CharField()
    total_checks = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    unique_expeditors = serializers.IntegerField()


class LocationStatisticsSummarySerializer(serializers.Serializer):
    city_statistics = CityStatisticsSerializer(many=True)
    sklad_statistics = SkladStatisticsSerializer(many=True)
    filial_statistics = FilialStatisticsSerializer(many=True)
    summary = serializers.DictField()


class BasicStatisticsSerializer(serializers.Serializer):
    total_checks = serializers.IntegerField()
    delivered_checks = serializers.IntegerField()
    failed_checks = serializers.IntegerField()
    pending_checks = serializers.IntegerField()
    unique_expeditors = serializers.IntegerField()
    unique_cities = serializers.IntegerField()
    unique_projects = serializers.IntegerField()


class RevenueStatisticsSerializer(serializers.Serializer):
    total_revenue = serializers.FloatField()
    avg_check_value = serializers.FloatField()
    total_cash = serializers.FloatField()
    total_cards = serializers.FloatField()
    total_click = serializers.FloatField()


class PerformanceMetricsSerializer(serializers.Serializer):
    success_rate = serializers.FloatField()
    avg_revenue_per_check = serializers.FloatField()
    revenue_per_expeditor = serializers.FloatField()


class RevenueSummarySerializer(serializers.Serializer):
    basic_statistics = BasicStatisticsSerializer()
    revenue_statistics = RevenueStatisticsSerializer()
    performance_metrics = PerformanceMetricsSerializer()


class HourlyDistributionSerializer(serializers.Serializer):
    hour = serializers.DateTimeField()
    checks_count = serializers.IntegerField()
    delivered_count = serializers.IntegerField()


class HourlyDistributionSummarySerializer(serializers.Serializer):
    hourly_distribution = HourlyDistributionSerializer(many=True)
    summary = serializers.DictField()
