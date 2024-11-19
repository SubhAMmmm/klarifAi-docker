# # chat/models.py
# from django.db import models
# from django.contrib.auth.models import User

# class File(models.Model):
#     file_id = models.AutoField(primary_key=True)
#     filename = models.CharField(max_length=255)
#     filepath = models.CharField(max_length=255)
#     upload_date = models.DateTimeField(auto_now_add=True)
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')

# class Conversation(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
#     message = models.TextField()
#     response = models.TextField(null=True, blank=True)
#     timestamp = models.DateTimeField(auto_now_add=True)


# models.py
from django.db import models
from django.contrib.auth.models import User

class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='documents/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class ProcessedIndex(models.Model):
    document = models.OneToOneField(Document, on_delete=models.CASCADE)
    faiss_index = models.CharField(max_length=255, help_text="Path to saved FAISS index file")
    metadata = models.CharField(max_length=255, help_text="Path to saved metadata file")
    summary = models.TextField(help_text="Generated summary of the document")
    markdown_path = models.CharField(max_length=255, help_text="Path to saved Markdown file with key terms")
    follow_up_question_1 = models.TextField(blank=True, null=True, help_text="First follow-up question")
    follow_up_question_2 = models.TextField(blank=True, null=True, help_text="Second follow-up question")
    follow_up_question_3 = models.TextField(blank=True, null=True, help_text="Third follow-up question")
    processed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Processed Index for {self.document.filename}"

class ChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    conversation_id = models.CharField(max_length=100)  # or use UUIDField for unique IDs
    title = models.CharField(max_length=255, blank=True, null=True)
