# Generated by Django 5.1.4 on 2025-01-05 18:28

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0010_idea_productidea2_generatedimage2_idea_product_idea"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="idea",
            name="product_idea",
        ),
        migrations.DeleteModel(
            name="GeneratedImage2",
        ),
        migrations.DeleteModel(
            name="Idea",
        ),
        migrations.DeleteModel(
            name="ProductIdea2",
        ),
    ]
