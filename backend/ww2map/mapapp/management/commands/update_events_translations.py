import json
from django.core.management.base import BaseCommand
from mapapp.models import Event, Country

class Command(BaseCommand):
    help = 'Update existing events with English translations from my_events_updated.json'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='my_events_updated.json',
            help='JSON file with updated event translations'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                events_data = json.load(f)
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(f'File {file_path} not found!')
            )
            return
        except json.JSONDecodeError as e:
            self.stdout.write(
                self.style.ERROR(f'Invalid JSON in {file_path}: {e}')
            )
            return

        updated_count = 0
        not_found_count = 0
        
        for event_data in events_data:
            event_id = event_data.get('id')
            title_en = event_data.get('title_en')
            description_en = event_data.get('description_en')
            
            try:
                # Find the existing event
                event = Event.objects.get(id=event_id)
                
                # Track if we make any updates
                updated = False
                
                # Update title_en if it's provided and different
                if title_en and title_en.strip():
                    if event.title_en != title_en:
                        event.title_en = title_en
                        updated = True
                        self.stdout.write(f'Updated title_en for event {event_id}')
                
                # Update description_en if it's provided and different
                if description_en and description_en.strip():
                    if event.description_en != description_en:
                        event.description_en = description_en
                        updated = True
                        self.stdout.write(f'Updated description_en for event {event_id}')
                
                # Save if we made updates
                if updated:
                    event.save()
                    updated_count += 1
                    
            except Event.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Event with ID {event_id} not found in database')
                )
                not_found_count += 1
                continue
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error updating event {event_id}: {e}')
                )
                continue

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nUpdate completed!'
                f'\n✅ Updated events: {updated_count}'
                f'\n⚠️  Events not found: {not_found_count}'
                f'\n📊 Total events processed: {len(events_data)}'
            )
        ) 