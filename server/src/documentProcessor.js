import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import os from 'os';

class DocumentProcessor {
    constructor() {
        this.embeddings = new OpenAIEmbeddings({ 
            model: "text-embedding-3-large" 
        });
        
        this.splitter = new RecursiveCharacterTextSplitter({ 
            chunkSize: 1000, 
            chunkOverlap: 200 
        });
    }

    async processFile(fileBuffer, fileName, fileType) {
        try {
            console.log(`📁 Processing file: ${fileName} (${fileType})`);
            let docs = [];
            
            switch (fileType) {
                case 'txt':
                    const textContent = fileBuffer.toString('utf-8');
                    docs = [{
                        pageContent: textContent,
                        metadata: { 
                            source: 'text_file', 
                            filename: fileName,
                            fileType: fileType,
                            processedAt: new Date().toISOString(),
                            contentLength: textContent.length
                        }
                    }];
                    break;
                case 'csv':
                    const csvContent = fileBuffer.toString('utf-8');
                    docs = [{
                        pageContent: csvContent,
                        metadata: { 
                            source: 'csv_file', 
                            filename: fileName,
                            fileType: fileType,
                            processedAt: new Date().toISOString(),
                            contentLength: csvContent.length
                        }
                    }];
                    break;
                case 'pdf':
                    try {
                        console.log(`📄 Processing PDF: ${fileName}`);
                        
                        // Create a temporary file to use with PDFLoader
                        const tempDir = os.tmpdir();
                        const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${fileName}`);
                        
                        // Write the buffer to temporary file
                        fs.writeFileSync(tempFilePath, fileBuffer);
                        console.log(`📁 Created temp file: ${tempFilePath}`);
                        
                        // Use PDFLoader to extract text
                        const pdfLoader = new PDFLoader(tempFilePath);
                        const pdfDocs = await pdfLoader.load();
                        
                        console.log(`📄 PDF loaded: ${pdfDocs.length} pages`);
                        
                        // Process the extracted documents
                        docs = pdfDocs.map((doc, index) => ({
                            pageContent: doc.pageContent,
                            metadata: {
                                ...doc.metadata,
                                source: 'pdf_file',
                                filename: fileName,
                                fileType: fileType,
                                processedAt: new Date().toISOString(),
                                pageNumber: index + 1,
                                totalPages: pdfDocs.length,
                                fileSizeBytes: fileBuffer.length,
                                fileSizeKB: Math.round(fileBuffer.length / 1024)
                            }
                        }));
                        
                        // Clean up temporary file
                        try {
                            fs.unlinkSync(tempFilePath);
                            console.log(`🗑️ Cleaned up temp file: ${tempFilePath}`);
                        } catch (cleanupError) {
                            console.warn(`⚠️ Could not clean up temp file: ${cleanupError.message}`);
                        }
                        
                        console.log(`✅ PDF processed: ${pdfDocs.length} pages, ${docs.reduce((sum, doc) => sum + doc.pageContent.length, 0)} characters extracted`);
                    } catch (pdfError) {
                        console.error(`❌ PDF processing error:`, pdfError);
                        // Fallback to basic placeholder content
                        const fileSizeKB = Math.round(fileBuffer.length / 1024);
                        docs = [{
                            pageContent: `File: ${fileName} (${fileType})\n\nError processing PDF: ${pdfError.message}\n\nThis PDF could not be processed. Please check if the file is corrupted or password-protected.\n\nFile Size: ${fileSizeKB} KB`,
                            metadata: { 
                                source: 'pdf_file_error', 
                                filename: fileName, 
                                type: fileType,
                                processedAt: new Date().toISOString(),
                                error: pdfError.message,
                                fileSizeBytes: fileBuffer.length,
                                fileSizeKB: fileSizeKB
                            }
                        }];
                    }
                    break;
                case 'docx':
                    docs = [{
                        pageContent: `File: ${fileName} (${fileType})\n\nNote: Full processing for ${fileType} files requires additional setup:\n\nFor PDF files:\n- Install pdf-parse or similar library\n- Extract text content from PDF\n- Handle formatting and structure\n\nFor DOCX files:\n- Install mammoth or similar library\n- Extract text content from Word documents\n- Handle formatting and structure\n\nThis is a placeholder for the file content.`,
                        metadata: { 
                            source: 'complex_file', 
                            filename: fileName, 
                            type: fileType,
                            processedAt: new Date().toISOString(),
                            note: 'Placeholder content - full processing not implemented'
                        }
                    }];
                    break;
                default:
                    throw new Error(`Unsupported file type: ${fileType}`);
            }

            console.log(`✅ Successfully processed ${fileName} with ${docs.length} document(s)`);
            const splitDocs = await this.splitter.splitDocuments(docs);
            return splitDocs;
        } catch (error) {
            console.error(`❌ Error processing file ${fileName}:`, error);
            throw error;
        }
    }

    async processWebsite(url) {
        try {
            console.log(`🌐 Scraping website: ${url}`);
            
            // Fetch the webpage
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000 // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            const $ = cheerio.load(html);
            
            // Remove script and style elements
            $('script').remove();
            $('style').remove();
            $('nav').remove();
            $('header').remove();
            $('footer').remove();
            $('aside').remove();
            
            // Extract meaningful content
            let content = '';
            
            // Get title
            const title = $('title').text().trim();
            if (title) {
                content += `Title: ${title}\n\n`;
            }
            
            // Get main content areas
            const mainContent = $('main, article, .content, .post, .entry, #content, .main').text().trim();
            if (mainContent) {
                content += mainContent + '\n\n';
            }
            
            // Get paragraph content
            const paragraphs = $('p').map((i, el) => $(el).text().trim()).get().join('\n\n');
            if (paragraphs) {
                content += paragraphs + '\n\n';
            }
            
            // Get headings
            const headings = $('h1, h2, h3, h4, h5, h6').map((i, el) => $(el).text().trim()).get().join('\n');
            if (headings) {
                content += `Headings:\n${headings}\n\n`;
            }
            
            // If no meaningful content found, use body text
            if (!content.trim()) {
                content = $('body').text().trim();
            }
            
            // Clean up the content
            content = content
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
                .trim();
            
            if (!content) {
                throw new Error('No content could be extracted from the website');
            }
            
            console.log(`✅ Successfully scraped ${content.length} characters from ${url}`);
            
            const docs = [{
                pageContent: content,
                metadata: { 
                    source: 'website', 
                    url: url,
                    title: title || 'Untitled',
                    scrapedAt: new Date().toISOString(),
                    contentLength: content.length
                }
            }];
            
            const splitDocs = await this.splitter.splitDocuments(docs);
            return splitDocs;
            
        } catch (error) {
            console.error(`❌ Error scraping website ${url}:`, error);
            // Return a fallback document with error information
            return [{
                pageContent: `Error scraping website: ${url}\n\nError: ${error.message}\n\nThis website could not be processed. Please check the URL or try again later.`,
                metadata: { 
                    source: 'website', 
                    url: url,
                    error: error.message,
                    scrapedAt: new Date().toISOString()
                }
            }];
        }
    }

    async processYoutube(url) {
        try {
            const docs = [{
                pageContent: `YouTube video: ${url}\n\nNote: YouTube processing not yet implemented. This is a placeholder for the video content.`,
                metadata: { source: 'youtube', url: url }
            }];
            
            const splitDocs = await this.splitter.splitDocuments(docs);
            return splitDocs;
        } catch (error) {
            console.error(`Error processing YouTube video ${url}:`, error);
            throw error;
        }
    }

    async processText(text) {
        try {
            const docs = [{
                pageContent: text,
                metadata: { 
                    source: 'text_input', 
                    timestamp: new Date().toISOString(),
                    type: 'text'
                }
            }];
            
            if (text.length <= 1000) {
                return docs;
            }
            
            const splitDocs = await this.splitter.splitDocuments(docs);
            return splitDocs;
        } catch (error) {
            console.error(`Error processing text:`, error);
            throw error;
        }
    }

    async addToVectorStore(docs, sourceType, sourceId) {
        try {
            if (!docs || docs.length === 0) {
                throw new Error('No documents to add to vector store');
            }
            
            console.log(`💾 Adding ${docs.length} documents to vector store for ${sourceType}: ${sourceId}`);
            console.log(`🔍 Document content preview:`, docs[0]?.pageContent?.substring(0, 100) + '...');
            
            const docsWithMetadata = docs.map(doc => ({
                ...doc,
                metadata: {
                    ...doc.metadata,
                    sourceType,
                    sourceId,
                    processedAt: new Date().toISOString()
                }
            }));

            console.log(`🔍 Metadata preview:`, JSON.stringify(docsWithMetadata[0]?.metadata, null, 2));

            // Create or get the vector store
            const vectorStore = new QdrantVectorStore(this.embeddings, {
                collectionName: 'sachinllm',
                url: process.env.QDRANT_URL,
            });

            console.log(`🔍 Vector store created, attempting to add documents...`);

            // Add documents to the existing collection
            const result = await vectorStore.addDocuments(docsWithMetadata);
            
            console.log(`✅ Successfully added ${docs.length} documents to vector store`);
            console.log(`🔍 Add result:`, result);
            
            // Verify the documents were actually added by doing a quick search
            try {
                const searchResult = await vectorStore.similaritySearch(docs[0].pageContent.substring(0, 50), 1);
                console.log(`🔍 Verification search found ${searchResult.length} results`);
                if (searchResult.length > 0) {
                    console.log(`🔍 First result metadata:`, searchResult[0].metadata);
                }
            } catch (verifyError) {
                console.log(`⚠️ Verification search failed:`, verifyError.message);
            }
            
            return vectorStore;
        } catch (error) {
            console.error(`❌ Error adding to vector store:`, error);
            console.error(`❌ Error details:`, {
                message: error.message,
                stack: error.stack,
                sourceType,
                sourceId,
                docsCount: docs?.length
            });
            throw error;
        }
    }

    async searchVectorStore(query, limit = 5) {
        try {
            console.log(`🔍 Searching vector store for: "${query}" (limit: ${limit})`);
            
            const vectorStore = new QdrantVectorStore(this.embeddings, {
                collectionName: 'sachinllm',
                url: process.env.QDRANT_URL,
            });

            // Get more results initially for better filtering
            const initialLimit = Math.min(limit * 3, 20);
            const rawResults = await vectorStore.similaritySearch(query, initialLimit);
            
            console.log(`🔍 Found ${rawResults.length} initial results`);
            
            if (rawResults.length === 0) {
                return [];
            }

            // Enhanced result processing with better ranking
            const enhancedResults = rawResults.map((result, index) => {
                // Calculate relevance score based on multiple factors
                let relevanceScore = 0;
                
                // Base score from vector similarity (higher is better)
                if (result.score !== undefined) {
                    relevanceScore += (1 - result.score) * 100; // Convert distance to similarity score
                }
                
                // Boost score for exact matches
                const queryLower = query.toLowerCase();
                const contentLower = result.pageContent.toLowerCase();
                if (contentLower.includes(queryLower)) {
                    relevanceScore += 20;
                }
                
                // Boost score for title/heading matches
                if (result.metadata?.title && result.metadata.title.toLowerCase().includes(queryLower)) {
                    relevanceScore += 15;
                }
                
                // Boost score for source type relevance
                if (result.metadata?.sourceType === 'pdf_file') {
                    relevanceScore += 5; // PDFs often contain more structured content
                }
                
                // Boost score for recent content
                if (result.metadata?.processedAt) {
                    const daysOld = (Date.now() - new Date(result.metadata.processedAt).getTime()) / (1000 * 60 * 60 * 24);
                    if (daysOld < 7) relevanceScore += 3; // Recent content gets slight boost
                }
                
                // Penalize very short content
                if (result.pageContent.length < 50) {
                    relevanceScore -= 10;
                }
                
                // Penalize very long content (might be too verbose)
                if (result.pageContent.length > 2000) {
                    relevanceScore -= 5;
                }

                return {
                    ...result,
                    relevanceScore: Math.max(0, relevanceScore), // Ensure non-negative
                    originalRank: index + 1
                };
            });

            // Sort by relevance score (highest first)
            enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
            
            // Take top results
            const topResults = enhancedResults.slice(0, limit);
            
            // Log ranking information
            console.log(`🔍 Top ${topResults.length} results after ranking:`);
            topResults.forEach((result, index) => {
                console.log(`  ${index + 1}. Score: ${result.relevanceScore.toFixed(1)}, Source: ${result.metadata?.sourceType || 'unknown'}, Length: ${result.pageContent.length} chars`);
            });

            return topResults;
            
        } catch (error) {
            console.error(`❌ Error searching vector store:`, error);
            throw error;
        }
    }

    async getCollectionInfo() {
        try {
            const vectorStore = new QdrantVectorStore(this.embeddings, {
                collectionName: 'sachinllm',
                url: process.env.QDRANT_URL,
            });

            const collections = await vectorStore.client.getCollections();
            const collection = collections.result.collections.find(c => c.name === 'sachinllm');
            
            return collection || null;
        } catch (error) {
            console.error(`Error getting collection info:`, error);
            return null;
        }
    }
}

export default DocumentProcessor;
