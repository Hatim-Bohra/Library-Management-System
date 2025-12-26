import kagglehub
import pandas as pd
import os
import random

def prepare_dataset():
    print("Downloading dataset...")
    # Download latest version
    path = kagglehub.dataset_download("ishikajohari/best-books-10k-multi-genre-data")
    print("Path to dataset files:", path)

    # Find the CSV file in the downloaded path
    csv_file = None
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".csv"):
                csv_file = os.path.join(root, file)
                break
    
    if not csv_file:
        print("No CSV file found in the downloaded dataset.")
        return

    print(f"Processing {csv_file}...")
    df = pd.read_csv(csv_file)

    # Inspect columns to map them correctly
    print("Original Columns:", df.columns.tolist())

    # Map columns to required format: Title,Author,ISBN,Genre,Description,CoverUrl,RentalPrice,Copies
    # Assuming column names based on dataset description or automatic inspection
    # Common mappings: 'Book'->Title, 'Author'->Author, 'ISBN'->ISBN, 'Genre'->Genre, 'Description'->Description
    
    # We will normalize column names first
    df.columns = [c.strip() for c in df.columns]

    # Create new dataframe with required columns
    new_df = pd.DataFrame()

    # Smart mapping (adjust based on actual csv content)
    # The dataset "ishikajohari/best-books-10k-multi-genre-data" usually has:
    # Book, Author, Description, Genres, Avg_Rating, Num_Ratings, URL
    
    new_df['Title'] = df['Book'] if 'Book' in df.columns else df.iloc[:, 0] # Fallback to 1st col
    new_df['Author'] = df['Author'] if 'Author' in df.columns else 'Unknown'
    new_df['ISBN'] = [f"978{random.randint(1000000000, 9999999999)}" for _ in range(len(df))] # Generate fake ISBNs if missing
    new_df['Genre'] = df['Genres'] if 'Genres' in df.columns else (df['Genre'] if 'Genre' in df.columns else 'General')
    new_df['Description'] = df['Description'] if 'Description' in df.columns else ''
    # Try to find cover image column
    cover_col = None
    for col in ['ImgUrl', 'image_url', 'cover', 'URL', 'image']:
        if col in df.columns:
            cover_col = col
            break
            
    new_df['CoverUrl'] = df[cover_col] if cover_col else 'https://placehold.co/400x600?text=No+Cover'

    new_df['RentalPrice'] = [round(random.uniform(1.99, 9.99), 2) for _ in range(len(df))]
    new_df['Copies'] = [random.randint(1, 10) for _ in range(len(df))]

    # Clean up Description
    new_df['Description'] = new_df['Description'].fillna('No description available.')
    
    # Selecting columns in order
    final_df = new_df[['Title', 'Author', 'ISBN', 'Genre', 'Description', 'CoverUrl', 'RentalPrice', 'Copies']]
    
    # Fill defaults
    final_df = final_df.fillna({
        'Author': 'Unknown',
        'Genre': 'General',
        'Description': 'No description.',
        'CoverUrl': 'https://placehold.co/400x600?text=No+Cover',
    })

    output_path = 'final_books_import.csv'
    final_df.to_csv(output_path, index=False)
    print(f"Successfully created {output_path} with {len(final_df)} records.")

if __name__ == "__main__":
    try:
        prepare_dataset()
    except ImportError as e:
        print(f"Error: {e}. Please install required packages: pip install kagglehub pandas")
    except Exception as e:
        print(f"An error occurred: {e}")
