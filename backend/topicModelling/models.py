from django.db import models
import pandas as pd
import pickle

class Dataset(models.Model):
    name = models.CharField(max_length=255, unique=True)  # To store the name of the dataset
    original_df = models.BinaryField()  # BinaryField to store the pickled DataFrame

    def save_dataframe(self, df):
        """Save a DataFrame as a binary field."""
        self.original_df = pickle.dumps(df)

    def load_dataframe(self):
        """Load a DataFrame from the binary field."""
        return pickle.loads(self.original_df)
    
    class Meta:
        app_label = 'topicModelling'