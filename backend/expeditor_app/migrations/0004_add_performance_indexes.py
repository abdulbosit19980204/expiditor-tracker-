# Generated migration for performance optimization indexes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expeditor_app', '0003_checkdetail_receiptiddate'),
    ]

    operations = [
        # Add indexes for Check model performance
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_check_yetkazilgan_vaqti ON expeditor_app_check(yetkazilgan_vaqti);",
            reverse_sql="DROP INDEX IF EXISTS idx_check_yetkazilgan_vaqti;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_check_status ON expeditor_app_check(status);",
            reverse_sql="DROP INDEX IF EXISTS idx_check_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_check_ekispiditor ON expeditor_app_check(ekispiditor);",
            reverse_sql="DROP INDEX IF EXISTS idx_check_ekispiditor;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_check_project ON expeditor_app_check(project);",
            reverse_sql="DROP INDEX IF EXISTS idx_check_project;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_check_city ON expeditor_app_check(city);",
            reverse_sql="DROP INDEX IF EXISTS idx_check_city;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_check_sklad ON expeditor_app_check(sklad);",
            reverse_sql="DROP INDEX IF EXISTS idx_check_sklad;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_check_yetkazilgan_date ON expeditor_app_check(yetkazilgan_vaqti);",
            reverse_sql="DROP INDEX IF EXISTS idx_check_yetkazilgan_date;"
        ),
        
        # Add indexes for CheckDetail model performance
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_checkdetail_check_id ON expeditor_app_checkdetail(check_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_checkdetail_check_id;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_checkdetail_total_sum ON expeditor_app_checkdetail(total_sum);",
            reverse_sql="DROP INDEX IF EXISTS idx_checkdetail_total_sum;"
        ),
        
        # Add indexes for Ekispiditor model performance
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_ekispiditor_is_active ON expeditor_app_ekispiditor(is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_ekispiditor_is_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_ekispiditor_filial ON expeditor_app_ekispiditor(filial_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_ekispiditor_filial;"
        ),
        
        # Add composite indexes for common query patterns
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_check_status_date ON expeditor_app_check(status, yetkazilgan_vaqti);",
            reverse_sql="DROP INDEX IF EXISTS idx_check_status_date;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_check_ekispiditor_date ON expeditor_app_check(ekispiditor, yetkazilgan_vaqti);",
            reverse_sql="DROP INDEX IF EXISTS idx_check_ekispiditor_date;"
        ),
    ]