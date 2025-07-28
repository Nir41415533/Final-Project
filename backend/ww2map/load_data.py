#!/usr/bin/env python
"""
Script to load initial data after deployment
Run this script after your first deployment to Render
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ww2map.settings')
django.setup()

from django.core.management import call_command

def load_data():
    """Load data from JSON files"""
    print("Starting data load...")
    
    try:
        # Load backup data if it exists
        if os.path.exists('backup_data.json'):
            print("Loading backup_data.json...")
            call_command('loaddata', 'backup_data.json')
            print("✅ backup_data.json loaded successfully")
        
        # Load events data if it exists  
        if os.path.exists('my_events_updated.json'):
            print("Loading my_events_updated.json...")
            call_command('loaddata', 'my_events_updated.json')
            print("✅ my_events_updated.json loaded successfully")
            
        print("🎉 All data loaded successfully!")
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = load_data()
    if success:
        print("Data loading completed successfully!")
    else:
        print("Data loading failed!")
        exit(1) 