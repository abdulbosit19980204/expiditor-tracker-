from expeditor_backend import settings
import os
from datetime import datetime


def get_last_update_date():
    path = settings.LAST_UPDATE_DATE_PATH
    if os.path.exists(path):
        with open(path, 'r') as file:
            date_str = file.read().strip()
            return date_str
    return "2025-06-10"

def save_last_update_date(date_str):
    path = settings.LAST_UPDATE_DATE_PATH
    with open(path, 'w') as file:
        file.write(date_str)

