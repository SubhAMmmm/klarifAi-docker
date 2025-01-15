from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from groq import Groq
import pandas as pd
import numpy as np
from textblob import TextBlob
from fuzzywuzzy import fuzz
import json
import re
from typing import List, Dict, Any, Tuple
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from sklearn.metrics.pairwise import cosine_similarity
import os

from .models import Dataset

class DataAnalysisViewSet(viewsets.ViewSet):
    """ViewSet for handling data analysis operations."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.groq_api_key = "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"
        self.gemini_api_key = "AIzaSyC5Dqjx0DLbkRXH9YWqWZ1SPTK0w0C4oFY"
        self.vector_db = None
        self.original_df = None
        self.df_copy = None

    def create_vector_db(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Create vector database from dataframe."""
        try:
            model = SentenceTransformer('all-MiniLM-L6-v2')
            
            def row_to_text(row):
                return ' '.join([f"{col}: {str(val)}" for col, val in row.items()])
            
            texts = df.apply(row_to_text, axis=1).tolist()
            embeddings = model.encode(texts, convert_to_numpy=True)
            
            return {
                'embeddings': embeddings,
                'texts': texts,
                'model': model
            }
        except Exception as e:
            return None
        
    def create_embeddings(self,df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame]:
        """
        Generate embeddings for each row in the dataset using numpy arrays.

        Args:
            df: Input DataFrame.

        Returns:
            Tuple containing:
            - Array of row embeddings.
            - Processed DataFrame (unchanged from input).
        """
        model = SentenceTransformer('all-MiniLM-L6-v2')

        def prepare_row_text(row: pd.Series) -> str:
            return ' '.join([f"{col}: {str(val)}" for col, val in row.items() if pd.notna(val) and val != ''])

        row_texts = df.apply(prepare_row_text, axis=1).tolist()
        batch_size = 32
        all_embeddings = []

        for i in range(0, len(row_texts), batch_size):
            batch = row_texts[i:i + batch_size]
            batch_embeddings = model.encode(
                batch,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            all_embeddings.append(batch_embeddings)

        row_embeddings = np.vstack(all_embeddings)
        return row_embeddings, df
    
    def classify_rows_by_topics(self, df: pd.DataFrame, topics: List[str], embeddings: np.ndarray, similarity_threshold: float = 0.3) -> pd.DataFrame:
        """
        Classify each row into relevant topics using numpy operations.
        """
        try:
            model = SentenceTransformer('all-MiniLM-L6-v2')
            topic_embeddings = model.encode(topics, convert_to_numpy=True, normalize_embeddings=True)
            
            # Compute similarity matrix
            similarity_matrix = np.dot(embeddings, topic_embeddings.T)
            
            # Add binary classification columns for each topic
            for i, topic in enumerate(topics):
                # Sanitize column name - replace special characters and spaces with underscores
                topic_col = re.sub(r'[^\w\s-]', '', topic).replace(' ', '_').lower()
                df[topic_col] = (similarity_matrix[:, i] > similarity_threshold).astype(int)
                
            return df
            
        except Exception as e:
            print(f"Error in classify_rows_by_topics: {str(e)}")
            return df


    @action(detail=False, methods=['post'])
    def upload_dataset(self, request):
        """Handle dataset upload and initial processing."""
        try:
            file_obj = request.FILES.get('file')
            if not file_obj:
                return Response(
                    {"error": "No file provided"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save file temporarily
            file_path = default_storage.save(f'temp/{file_obj.name}', ContentFile(file_obj.read()))
            
            # Read dataset
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(default_storage.path(file_path))
            else:
                df = pd.read_excel(default_storage.path(file_path))
            
            
            if df.empty:
                return Response(
                    {"error": "Empty dataset"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save the DataFrame to the database
            dataset, created = Dataset.objects.get_or_create(name="original_dataset")
            dataset.save_dataframe(df)
            dataset.save()
            
            # Generate topics
            topics = self.generate_dataset_specific_topics(df)
            
            if topics:
                # Process dataset with topics
                results = self.process_dataset_with_topics(df, topics)
                
                # Print the response for debugging
                print("API Response:", {
                    "message": "Dataset processed successfully",
                    "shape": df.shape,
                    #"topics": topics,
                   # "topic_analysis": results.get('analysis_results', {}),
                   # "insights": results.get('insights', {})
                })
                
                return Response({
                    "message": "Dataset processed successfully",
                    "shape": df.shape,
                    "topics": topics,
                    "topic_analysis": results.get('analysis_results', {}),
                    "insights": results.get('insights', {})
                })
            else:
                return Response(
                    {"error": "Failed to generate topics"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            print(f"Error in upload_dataset: {str(e)}")  # Add debugging
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def generate_dataset_specific_topics(self, df: pd.DataFrame) -> List[str]:
        """Generate topics from dataset using Gemini."""
        try:
            genai.configure(api_key=self.gemini_api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            df_sample = df.sample(n=40, random_state=42)
            dataset_content = self._prepare_dataset_content(df_sample)
            
            prompt = f"""
                OBJECTIVE:
                Generate a comprehensive, hierarchical list of ALL topics and subtopics from the provided dataset content using a numbered and sub-numbered format.
        
                DATASET OVERVIEW:
                Columns: {len(df.columns)}
                Rows: {len(df)}
            
                DATASET CONTENT:
                {dataset_content}
        
                OUTPUT FORMAT REQUIREMENTS:
                1. Use numbered main topics (1., 2., 3., etc.)
                2. Use single indented bullet points (-) for subtopics
                3. No asterisks, parentheses, or explanatory notes
                4. No colons after topic names
                5. Clean, consistent hierarchy
                6. No line breaks between topics and their subtopics
                7. One line break between main topic sections
        
                EXAMPLE FORMAT:
                1. Main Topic Name
                - Subtopic one
                - Subtopic two
                - Subtopic three
        
                2. Second Main Topic
                - Subtopic one
                - Subtopic two
                - Subtopic three
        
                CRITICAL REQUIREMENTS:
                - Extract ALL possible topics and subtopics from the dataset
                - Base topics SOLELY on information present in the data
                - Include both explicit and implicit topics
                - Ensure comprehensive coverage
                - Keep topics distinct and non-overlapping
                - Use clear, specific language
                - Group related content logically
                - Maintain consistent formatting
                - No explanatory text or descriptions
                - No duplicate topics or subtopics
                - Include ALL relevant categories from the data
        
                Note: The response should be complete and self-contained, without breaking into multiple parts or requiring continuation.
                """



            response = model.generate_content(prompt)
            
            subtopics = [
                line.strip().lstrip('- ').strip()
                for line in response.text.split('\n')
                if line.strip() and line.strip().startswith('-')
            ]
            
            return subtopics
            
        except Exception as e:
            return None

    def _prepare_dataset_content(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Prepare dataset content for topic generation."""
        dataset_content = {
            "column_names": list(df.columns),
            "unique_values": {},
            "data_samples": {}
        }
        
        for column in df.columns:
            unique_values = df[column].dropna().unique()
            dataset_content["unique_values"][column] = list(unique_values[:50])
            
            if pd.api.types.is_numeric_dtype(df[column]):
                dataset_content["data_samples"][column] = {
                    "type": "numeric",
                    "samples": list(df[column].dropna().sample(min(10, len(df[column]))).values)
                }
            elif pd.api.types.is_datetime64_any_dtype(df[column]):
                dataset_content["data_samples"][column] = {
                    "type": "datetime",
                    "samples": list(df[column].dropna().sample(min(10, len(df[column]))).astype(str).values)
                }
            else:
                dataset_content["data_samples"][column] = {
                    "type": "text",
                    "samples": list(df[column].dropna().sample(min(10, len(df[column]))).values)
                }
                
        return dataset_content
        
    
    

    def decompose_question(self, main_question: str) -> List[str]:
        """Break down main question into specific sub-questions using Gemini AI."""
        try:
            prompt = f"""
                Act as an expert data analyst. Break down this complex analysis request into specific, focused sub-questions that together will provide a comprehensive answer.

                Original Request:
                {main_question}

                Instructions:
                1. Analyze the main request and identify distinct analysis components
                2. Create separate, specific questions for each component
                3. Ensure each sub-question:
                - Focuses on one specific aspect
                - Is clearly defined and answerable
                - Can be analyzed using either SQL queries or semantic search
                - Contributes to the overall analysis
                4. Include questions for both quantitative and qualitative aspects
                5. Order questions logically from basic to complex analysis

                Key Information Areas to Explore:
                1. Content Trends:
                * Identify recurring patterns or topics of discussion
                * Analyze word frequency and dominant topics
                * Track changes in content patterns over time
                2. Sentiments and Opinions:
                * Measure overall sentiment distribution (positive, negative, neutral)
                * Identify topics with strong sentiment associations
                * Analyze sentiment trends and variations
                3. Topics and Themes:
                * Extract and categorize core subjects
                * Calculate topic frequency and distribution
                * Map relationships between different themes

                Response Format:
                Return ONLY a Python list of strings, with each string being a focused sub-question derived directly from the original request. Format:
                [
                    "First focused sub-question addressing a specific aspect",
                    "Second focused sub-question covering another component",
                    "Third focused sub-question examining additional details",
                    "Fourth focused sub-question exploring final elements"
                ]

                Important:
                - Each sub-question should be self-contained and specific
                - Avoid overlapping questions
                -only give the questions dont give any additional syntax like ```python
                - Include both data-driven and contextual questions
                - Ensure questions align with available data analysis methods
                - Cover all key information areas (content trends, sentiments, topics)
                """
            
            gemini = genai.GenerativeModel('gemini-pro')
            genai.configure(api_key="AIzaSyAMAFDLQ641viyiISfvSj906w9EK4kn1E0")
            response = gemini.generate_content(prompt)
            print("responseeeeeeeeeeee=",response.text)
            return eval(response.text)
        except Exception as e:
            return []

    def extract_topics_from_question(self, question: str) -> List[str]:
        """Extract topics from the user's question using Gemini model."""
        if not question:
            return []
            
        try:
            genai.configure(api_key=self.gemini_api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt =f"""
            OBJECTIVE:
            Extract ONLY the important topic words directly from the given question. Do not add any new words or related topics.
           
            RULES:
            1. Only use words that appear in the original question
            2. Remove common words (articles, prepositions, etc.)
            3. Do not add synonyms or related terms
            4. Do not create new categories or topics
            5. Focus on nouns and key terms
           
            QUESTION:
            {question}
           
            OUTPUT FORMAT:
            - Return only the extracted words, one per line
            - No explanations or additional text
            - No categorization or grouping
            """
            
            response = model.generate_content(prompt)
            topics = [
                line.strip().strip('- ').lower()
                for line in response.text.split('\n')
                if line.strip() and not line.startswith('#')
            ]
            
            return list(dict.fromkeys(topics))
        except Exception as e:
            return []

    def analyze_topics_in_rows(self, df: pd.DataFrame, topics: List[str]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Analyze topics in each row and calculate statistics."""
        analysis_df = df.copy()
        
        # Initialize topic columns
        for topic in topics:
            col_name = topic.replace(' ', '_').lower()
            analysis_df[col_name] = 0
        
        # Analyze each text column for topics
        text_columns = df.select_dtypes(include=['object']).columns
        for topic in topics:
            col_name = topic.replace(' ', '_').lower()
            for text_col in text_columns:
                topic_presence = analysis_df[text_col].apply(
                    lambda x: self._check_topic_presence(x, topic)
                )
                analysis_df[col_name] = analysis_df[col_name] | topic_presence
        
        # Calculate statistics
        stats = self._calculate_topic_statistics(analysis_df, topics)
        
        return analysis_df, stats

    def _check_topic_presence(self, text: str, topic: str) -> int:
        """Check if a topic is present in text using various matching methods."""
        if pd.isna(text):
            return 0
            
        text_lower = str(text).lower()
        topic_lower = topic.lower()
        
        # Direct match
        if topic_lower in text_lower:
            return 1
            
        # Word-based matching
        text_words = set(re.findall(r'\w+', text_lower))
        topic_words = set(re.findall(r'\w+', topic_lower))
        if len(topic_words.intersection(text_words)) >= len(topic_words) * 0.5:
            return 1
            
        # Fuzzy matching
        if fuzz.partial_ratio(topic_lower, text_lower) > 80:
            return 1
            
        return 0

    def _calculate_topic_statistics(self, df: pd.DataFrame, topics: List[str]) -> Dict[str, Any]:
        """Calculate comprehensive statistics for topics."""
        stats = {}
        topic_columns = [topic.replace(' ', '_').lower() for topic in topics]
        
        # Basic statistics
        stats['topic_coverage'] = {
            topic: {
                'count': int(df[col].sum()),
                'percentage': float(df[col].mean() * 100)
            }
            for topic, col in zip(topics, topic_columns)
        }
        
        # Co-occurrence matrix
        cooccurrence = pd.DataFrame(index=topics, columns=topics)
        for t1 in topics:
            col1 = t1.replace(' ', '_').lower()
            for t2 in topics:
                col2 = t2.replace(' ', '_').lower()
                cooccurrence.loc[t1, t2] = int(
                    (df[col1] & df[col2]).sum()
                )
        stats['cooccurrence'] = cooccurrence.to_dict()
        
        # Additional metrics
        stats['metrics'] = {
            'total_rows': len(df),
            'rows_with_topics': int((df[topic_columns].sum(axis=1) > 0).sum()),
            'avg_topics_per_row': float(df[topic_columns].sum(axis=1).mean()),
            'max_topics_per_row': int(df[topic_columns].sum(axis=1).max())
        }
        
        return stats

    @action(detail=False, methods=['post'])
    def analyze_sentiment(self, request):
        """Analyze sentiment in text columns."""
        try:
            if self.original_df is None:
                return Response(
                    {"error": "No dataset loaded"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            text_columns = request.data.get('text_columns', [])
            if not text_columns:
                text_columns = self.original_df.select_dtypes(include=['object']).columns.tolist()

            sentiment_results = {}
            for column in text_columns:
                if column in self.original_df.columns:
                    sentiments = self._analyze_column_sentiment(self.original_df[column])
                    sentiment_results[column] = sentiments

            return Response({
                "sentiment_analysis": sentiment_results
            })

        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _analyze_column_sentiment(self, series: pd.Series) -> Dict[str, Any]:
        """Analyze sentiment for a column using TextBlob."""
        sentiments = []
        for text in series.dropna():
            try:
                analysis = TextBlob(str(text))
                sentiments.append({
                    'polarity': analysis.sentiment.polarity,
                    'subjectivity': analysis.sentiment.subjectivity
                })
            except:
                continue

        if not sentiments:
            return {}

        df_sentiments = pd.DataFrame(sentiments)
        return {
            'average_polarity': float(df_sentiments['polarity'].mean()),
            'average_subjectivity': float(df_sentiments['subjectivity'].mean()),
            'sentiment_distribution': {
                'positive': int((df_sentiments['polarity'] > 0).sum()),
                'neutral': int((df_sentiments['polarity'] == 0).sum()),
                'negative': int((df_sentiments['polarity'] < 0).sum())
            }
        }

    @action(detail=False, methods=['post'])
    def semantic_search(self, request):
        """Perform semantic search using vector database."""
        try:
            question = request.data.get('question')
            if not question:
                return Response(
                    {"error": "No question provided"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not self.vector_db:
                return Response(
                    {"error": "Vector database not initialized"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            results = self._perform_semantic_search(question)
            return Response(results)

        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _perform_semantic_search(self, question: str) -> Dict[str, Any]:
        """Execute semantic search and generate response."""
        # Generate question embedding
        question_embedding = self.vector_db['model'].encode([question])[0]
        
        # Calculate similarities
        similarities = np.dot(self.vector_db['embeddings'], question_embedding)
        
        # Get top 5 most relevant rows
        top_indices = similarities.argsort()[-5:][::-1]
        relevant_texts = [self.vector_db['texts'][i] for i in top_indices]
        
        # Generate response using Groq
        context = "\n".join([f"Row {i+1}: {text}" for i, text in enumerate(relevant_texts)])
        
        client = Groq(api_key=self.groq_api_key)
        prompt = f"""
        Question: {question}
        
        Relevant Data Context:
        {context}
        
        Based on the provided context, please provide a clear and concise answer.
        Focus only on information that's directly supported by the data shown above.
        """
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful data analyst."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500
        )
        
        return {
            'answer': response.choices[0].message.content,
            'relevant_contexts': relevant_texts
        }

    def determine_analysis_type(question: str, api_key: str) -> str:
        """Determine whether to use SQL or semantic search."""
        prompt = f"""
        Analyze this question and determine the best approach between:
        1. SQL Query (for quantitative analysis, aggregations, metrics)
        2. Semantic Search (for contextual understanding, patterns)
        
        Question: {question}
        Return ONLY 'Semantic Search'
        """
        
        try:
            gemini = genai.GenerativeModel('gemini-pro')
            genai.configure(api_key="AIzaSyC5Dqjx0DLbkRXH9YWqWZ1SPTK0w0C4oFY")
            response = gemini.generate_content(prompt)
            analysis_type = response.text.strip()
            
            if analysis_type  in ["Semantic Search"]:
                return "Semantic Search"
            return analysis_type
        except Exception as e:
            print(f"Error determining analysis type: {str(e)}")
            return "SQL Query"

    # def process_dataset_with_topics(self, df: pd.DataFrame, topics: List[str]) -> Dict[str, Any]:
    #     """
    #     Process a dataset with topic classification and analysis.
    #     """
    #     try:
    #         # Generate embeddings for rows in the dataset
    #         row_embeddings, processed_df = self.create_embeddings(df)
            
    #         # Create sanitized topic columns first
    #         topic_columns = {}
    #         for topic in topics:
    #             # Sanitize column name
    #             col_name = re.sub(r'[^\w\s-]', '', topic).replace(' ', '_').lower()
    #             topic_columns[topic] = col_name
    #             processed_df[col_name] = 0  # Initialize with zeros
                
    #         # Classify rows based on the provided topics
    #         classified_df = self.classify_rows_by_topics(processed_df, topics, row_embeddings)
            
    #         # Perform topic distribution analysis
    #         analysis_results = self.analyze_topic_distribution(classified_df, topics)
            
    #         # Generate insights using the topic_columns mapping
    #         insights = self._generate_topic_insights(analysis_results, classified_df, topic_columns)
            
    #         return {
    #             'topic_analysis': analysis_results,
    #             'insights': insights
    #         }
            
    #     except Exception as e:
    #         print(f"Error in process_dataset_with_topics: {str(e)}")
    #         return {
    #             'topic_analysis': {},
    #             'insights': {}
    #         }
            
    def process_dataset_with_topics(self,df: pd.DataFrame, topics: List[str]) -> Dict[str, Any]:
        """Process a dataset with topic classification and analysis."""
        row_embeddings, processed_df = self.create_embeddings(df)
        classified_df = self.classify_rows_by_topics(processed_df, topics, row_embeddings)
        analysis_results = self.analyze_topic_distribution(classified_df, topics)
        insights = self.generate_topic_insights(analysis_results, classified_df)
        
        
        return {
            'classified_df': classified_df,
            'analysis_results': analysis_results,
            'insights': insights
        }

    def analyze_topic_distribution(self, df: pd.DataFrame, topics: List[str]) -> Dict[str, Any]:
        """
        Perform quantitative analysis based on topic classifications.
        """
        results = {}
        
        try:
            # Create mapping between original topics and sanitized column names
            topic_to_col = {
                topic: re.sub(r'[^\w\s-]', '', topic).replace(' ', '_').lower()
                for topic in topics
            }
            
            # Topic distribution
            topic_counts = {}
            for topic in topics:
                col = topic_to_col[topic]
                if col in df.columns:
                    count = int(df[col].sum())
                    percentage = float(count / len(df) * 100) if len(df) > 0 else 0
                    topic_counts[topic] = {
                        'count': count,
                        'percentage': round(percentage, 2)
                    }
            results['topic_distribution'] = topic_counts
            
            # Co-occurrence matrix
            cooccurrence = {}
            for topic1 in topics:
                col1 = topic_to_col[topic1]
                cooccurrence[topic1] = {}
                for topic2 in topics:
                    col2 = topic_to_col[topic2]
                    if col1 in df.columns and col2 in df.columns:
                        count = int((df[col1] & df[col2]).sum())
                        cooccurrence[topic1][topic2] = count
            results['topic_cooccurrence'] = cooccurrence
            
            # Topic correlations with numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            numeric_cols = [col for col in numeric_cols if col not in topic_to_col.values()]
            
            correlations = {}
            for topic in topics:
                col = topic_to_col[topic]
                if col in df.columns:
                    topic_corr = {}
                    for numeric_col in numeric_cols:
                        corr = float(df[col].corr(df[numeric_col]))
                        if not np.isnan(corr):
                            topic_corr[numeric_col] = round(corr, 3)
                    if topic_corr:
                        correlations[topic] = topic_corr
            results['topic_correlations'] = correlations
            
            return results
            
        except Exception as e:
            print(f"Error in analyze_topic_distribution: {str(e)}")
            return {
                'topic_distribution': {},
                'topic_cooccurrence': {},
                'topic_correlations': {}
            }


    

    

    # def generate_topic_insights(self, df: pd.DataFrame, topics: List[str]) -> Dict[str, Any]:
    #     """Generate insights from topic analysis."""
    #     insights = {}
        
    #     # Topic distribution
    #     topic_counts = df[topics].sum()
    #     insights['topic_distribution'] = {
    #         topic: int(count) 
    #         for topic, count in topic_counts.items()
    #     }
        
    #     # Calculate percentages
    #     total_rows = len(df)
    #     insights['topic_percentages'] = {
    #         topic: (count / total_rows) * 100 
    #         for topic, count in topic_counts.items()
    #     }
        
    #     # Topic correlations
    #     correlations = df[topics].corr().to_dict()
    #     insights['topic_correlations'] = correlations
        
    #     return insights

    def generate_topic_insights(self, analysis_results: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        insights = {}
        total_rows = len(df)

        # Topic distribution as DataFrame
        dist = analysis_results['topic_distribution']

        # Create distribution DataFrame
        dist_data = []
        for topic, data in dist.items():
            count = data.get('count', 0)
            percentage = data.get('percentage', 0)
            dist_data.append({
                'Topic': topic,
                'Count': count,
                'Percentage': f"{percentage:.1f}%"
            })

        # Convert to DataFrame and sort by count descending
        dist_df = pd.DataFrame(dist_data)
        dist_df = dist_df.sort_values('Count', ascending=False)
        
        # Convert DataFrame to a JSON-serializable format
        insights['distribution_df'] = dist_df.to_dict(orient='records')

        # Strong correlations
        correlations = analysis_results.get('topic_correlations', {})
        corr_insights = []
        for topic, corr_dict in correlations.items():
            strong_corr = {k: v for k, v in corr_dict.items() if abs(v) > 0.3}
            if strong_corr:
                corr_insights.append(f"\n{topic}:")
                for col, corr in strong_corr.items():
                    corr_insights.append(f"- {col}: {corr:.3f}")
        insights['correlations'] = "\n".join(corr_insights)

        # Topic co-occurrence insights
        cooccurrence = analysis_results.get('topic_cooccurrence', {})
        cooc_data = []
        for topic1, topic_dict in cooccurrence.items():
            for topic2, count in topic_dict.items():
                clean_topic1 = ' '.join(word.capitalize() for word in topic1.split())
                clean_topic2 = ' '.join(word.capitalize() for word in topic2.split())

                if clean_topic1 < clean_topic2 and count > 10:
                    cooc_data.append({
                        'Topic Pair': f"{clean_topic1} + {clean_topic2}",
                        'Count': count
                    })

        if cooc_data:
            cooc_df = pd.DataFrame(cooc_data).sort_values('Count', ascending=False)
            insights['cooccurrence_df'] = cooc_df.to_dict(orient='records')
        else:
            insights['cooccurrence_df'] = []

        return insights



    def synthesize_results(self, question_data: Dict[str, str], all_results: Dict[str, Any], llm: Any = None) -> str:
        """Synthesize results using LLM."""
        try:
            # Extract main question from question_data
            main_question = question_data.get('main_question', '')
            
            # Convert results to serializable format
            serializable_results = json.dumps(all_results, default=str)
                
            # Use Groq API directly if LLM is not provided
            client = Groq(api_key=self.groq_api_key)
            
            prompt = f"""
                Synthesize a comprehensive answer based on the following:
                
                Original Question: {main_question}
                Analysis Results: {serializable_results}
                
                Provide a clear, well-structured answer that:
                1. Directly addresses the original question
                2. Combines insights from all sub-analyses
                3. Highlights key findings and relationships
                4. Presents quantitative results when available
                5. Provides qualitative insights
                """
                
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a helpful data analyst."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500
            )
                
            return response.choices[0].message.content
                
        except Exception as e:
            print(f"Error in synthesize_results: {str(e)}")
            return f"Error synthesizing results: {str(e)}"
        
    def answer_question_with_embeddings(self, df: pd.DataFrame, vector_db: Dict[str, Any], groq_api_key: str, question: str) -> str:
        """
        Process semantic search questions with improved error handling.
        
        Args:
            df: Input DataFrame
            vector_db: Vector database dictionary containing embeddings and model
            groq_api_key: API key for Groq
            question: Question to be answered
            
        Returns:
            str: Response from the LLM based on relevant context
        """
        try:
            # Validate vector database
            if not vector_db or 'embeddings' not in vector_db:
                return "Vector database not initialized properly."
            
            # Initialize Groq client
            client = Groq(api_key=groq_api_key)
            
            # Generate question embedding
            question_embedding = vector_db['model'].encode([question])[0]
            
            # Calculate similarities
            similarities = cosine_similarity([question_embedding], vector_db['embeddings'])[0]
            
            # Get top 5 most relevant rows
            top_indices = similarities.argsort()[-5:][::-1]
            relevant_texts = [vector_db['texts'][i] for i in top_indices]
            
            # Prepare context
            context = "\n".join([f"Row {i+1}: {text}" for i, text in enumerate(relevant_texts)])
            
            # Construct prompt
            prompt = f"""
            Question: {question}
            
            Relevant Data Context:
            {context}
            
            Based on the provided context, please provide a clear and concise answer.
            Focus only on information that's directly supported by the data shown above.
            """
            
            # Get response from Groq
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a helpful data analyst."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error in semantic search: {str(e)}")
            return f"Error processing question: {str(e)}"
        
    def analyze_sub_question(self, question: str, analysis_type: str, groq_api_key: str) -> Dict[str, Any]:
        """
        Analyze a single sub-question with improved error handling for Django.
        
        Args:
            question: The sub-question to analyze
            analysis_type: Type of analysis ("SQL Query" or "Semantic Search")
            groq_api_key: API key for Groq
            
        Returns:
            Dict containing analysis results
        """
        try:
            results = {}
            
            # Load dataset
            try:
                dataset = Dataset.objects.get(name="original_dataset")
                df = dataset.load_dataframe()
            except Dataset.DoesNotExist:
                return {"error": "No dataset loaded"}
                
            if analysis_type == "SQL Query":
                # For now, we'll skip SQL analysis since it requires different handling in Django
                # You can add SQL analysis logic here if needed
                pass
                
            elif analysis_type == "Semantic Search":
                if hasattr(self, 'vector_db') and self.vector_db:
                    semantic_result = self.answer_question_with_embeddings(
                        df,
                        self.vector_db,
                        groq_api_key,
                        question
                    )
                    if semantic_result:
                        results['semantic'] = semantic_result
                else:
                    # Initialize vector database if not exists
                    self.vector_db = self.create_vector_db(df)
                    if self.vector_db:
                        semantic_result = self.answer_question_with_embeddings(
                            df,
                            self.vector_db,
                            groq_api_key,
                            question
                        )
                        if semantic_result:
                            results['semantic'] = semantic_result
                    else:
                        results['semantic'] = "Vector database initialization failed. Using alternative analysis method."
                        # Fall back to SQL analysis
                        results.update(self.analyze_sub_question(question, "SQL Query", groq_api_key))
                        
            return results
            
        except Exception as e:
            print(f"Error analyzing sub-question: {str(e)}")
            return {"error": str(e)}
            
    
    @action(detail=False, methods=['post'])
    def enhanced_handle_custom_analysis(self, request):
        """
        Enhanced custom analysis handler for Django that matches Streamlit's output structure
        """
        try:
            analysis_question = request.data.get('analysis_question', '')
            if not analysis_question:
                return Response(
                    {"error": "Analysis question is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Load dataset
            try:
                dataset = Dataset.objects.get(name="original_dataset")
                df = dataset.load_dataframe()
            except Dataset.DoesNotExist:
                return Response(
                    {"error": "No dataset loaded"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Step 1: Question Decomposition
            sub_questions = self.decompose_question(analysis_question)
            print("sub_questions111111111111111@@@@===", sub_questions)
            if not sub_questions:
                sub_questions = [
                    "What are the key patterns in the data?",
                    "What are the main trends over time?",
                    "What are the significant relationships between variables?"
                ]
            print("sub_questions===", sub_questions)
            # Step 2: Topic Analysis
            topics = self.extract_topics_from_question(analysis_question)
            topics = list(set([topic.rstrip('?') for topic in topics]))

            response_data = {
                "analysis_components": {
                    "title": "Breaking down analysis into components",
                    "items": [{"index": i, "question": q} for i, q in enumerate(sub_questions, 1)]
                }
            }

            if topics:
                # Topic Analysis
                analysis_df, stats = self.analyze_topics_in_rows(df.copy(), topics)
                
                # Prepare numerical statistics
                numerical_stats = {
                    "topic_coverage": {
                        topic: {
                            "count": stats["topic_coverage"][topic]["count"],
                            "percentage": f"{stats['topic_coverage'][topic]['percentage']:.1f}%",
                            "co_occurrence": f"{(stats['cooccurrence'][topic][topic] / len(analysis_df)) * 100:.1f}%"
                        } for topic in topics
                    }
                }

                # Add correlations if available
                if "numeric_correlations" in stats:
                    correlations_data = []
                    for topic in topics:
                        topic_col = topic.replace(' ', '_').lower()
                        if topic_col in stats["numeric_correlations"]:
                            for num_col, corr in stats["numeric_correlations"][topic_col].items():
                                clean_num_col = num_col.replace('topic_', '').replace('_', ' ')
                                correlations_data.append({
                                    "Keywords": topic,
                                    "Numeric Variable": clean_num_col,
                                    "Correlation": f"{corr:.3f}"
                                })
                    
                    numerical_stats["correlations"] = correlations_data

                # Coverage statistics
                coverage_stats = [
                    {
                        "Keywords": topic,
                        "Occurrence Count": stats["topic_coverage"][topic]["count"],
                        "Coverage %": f"{stats['topic_coverage'][topic]['percentage']:.1f}%"
                    } for topic in topics
                ]

                response_data["numerical_analysis"] = {
                    "identified_keywords": topics,
                    "coverage_statistics": coverage_stats,
                    "correlations": numerical_stats.get("correlations", [])
                }

            # Step 3: Sub-question Analysis
            all_results = {}
            for sub_q in sub_questions:
                analysis_type = self.determine_analysis_type(sub_q)
                results = self.analyze_sub_question(
                    sub_q,
                    analysis_type,
                    self.groq_api_key
                )
                if results:
                    all_results[sub_q] = {
                        "question": sub_q,
                        "results": results
                    }

            # Add numerical stats to results for synthesis
            if numerical_stats:
                all_results["numerical_analysis"] = {
                    "stats": numerical_stats,
                    "type": "statistics"
                }

            # Step 4: Final Synthesis
            analysis_context = {
                "main_question": analysis_question,
                "instructions": """
                    Please provide a detailed analysis that:
                    1. Addresses the main question
                    2. Incorporates the numerical statistics and their implications
                    3. Highlights key patterns and relationships
                    4. Provides context for the topic coverage and correlations
                    5. Draws meaningful conclusions from both qualitative and quantitative data
                """
            }

            final_answer = self.synthesize_results(analysis_context, all_results)
            
            # Add final analysis to response
            response_data["analysis_results"] = {
                "summary": final_answer,
                "detailed_analysis": {
                    q: {
                        "question": result_data["question"],
                        "results": self.format_analysis_results(result_data["results"])
                    }
                    for q, result_data in all_results.items()
                    if q != "numerical_analysis"
                }
            }
            print("response_data===",response_data)
            return Response(response_data)

        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def format_analysis_results(self, results):
        """Helper method to format analysis results for JSON response"""
        if isinstance(results, dict):
            formatted_results = {}
            if 'sql' in results:
                formatted_results['sql'] = results['sql'].to_dict() if isinstance(results['sql'], pd.DataFrame) else results['sql']
            if 'semantic' in results:
                formatted_results['semantic'] = results['semantic']
            return formatted_results
        return results

        
    def setup_llm(self):
        """Initialize LLM with proper error handling."""
        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                temperature=0.2,
                google_api_key="AIzaSyAMAFDLQ641viyiISfvSj906w9EK4kn1E0",
                convert_system_message_to_human=True
            )
            
            prompt = PromptTemplate(
                input_variables=["question", "schema"],
                template="""
                Analyze the following data and question:
                
                Schema:
                {schema}
                
                Question:
                {question}
                
                Provide a clear and concise analysis focusing on the most relevant aspects.
                """
            )
            
            return prompt, llm
        except Exception as e:
            print(f"Error setting up LLM: {str(e)}")
            return None, None