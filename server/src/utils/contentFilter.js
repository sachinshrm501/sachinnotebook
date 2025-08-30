class ContentFilter {
    constructor() {
        // Adult content keywords and patterns
        this.adultContentPatterns = [
            // Explicit adult terms
            /\b(sex|porn|xxx|adult|nude|naked|explicit|erotic|intimate)\b/i,
            // URLs to adult sites
            /(pornhub|xvideos|xnxx|redtube|youporn|tube8)/i,
            // Adult content indicators
            /(18\+|adult content|mature content|explicit content)/i,
            // Inappropriate language patterns
            /\b(fuck|shit|bitch|asshole|dick|pussy|cock|vagina)\b/i
        ];

        // Suspicious patterns that might indicate adult content
        this.suspiciousPatterns = [
            // Age verification patterns
            /(verify.*age|age.*verification|enter.*birthday)/i,
            // Adult site redirects
            /(redirect.*adult|adult.*redirect)/i,
            // Content warnings
            /(content.*warning|viewer.*discretion|mature.*audience)/i
        ];

        // Blocked domains
        this.blockedDomains = [
            'pornhub.com',
            'xvideos.com',
            'xnxx.com',
            'redtube.com',
            'youporn.com',
            'tube8.com',
            'adultfriendfinder.com',
            'ashleymadison.com'
        ];
    }

    // Check if content contains adult material
    isAdultContent(content, sourceType = 'text') {
        try {
            if (!content || typeof content !== 'string') {
                return { isAdult: false, reason: null };
            }

            const contentLower = content.toLowerCase();
            const contentLength = content.length;

            // Check for blocked keywords
            for (const pattern of this.adultContentPatterns) {
                if (pattern.test(contentLower)) {
                    return { 
                        isAdult: true, 
                        reason: 'Contains explicit adult content',
                        pattern: pattern.source,
                        confidence: 'high'
                    };
                }
            }

            // Check for suspicious patterns
            let suspiciousCount = 0;
            for (const pattern of this.suspiciousPatterns) {
                if (pattern.test(contentLower)) {
                    suspiciousCount++;
                }
            }

            // If multiple suspicious patterns found, flag for review
            if (suspiciousCount >= 2) {
                return { 
                    isAdult: true, 
                    reason: 'Multiple suspicious patterns detected',
                    suspiciousCount,
                    confidence: 'medium'
                };
            }

            // Check content length and suspicious ratios
            const suspiciousWords = this.countSuspiciousWords(contentLower);
            const wordCount = contentLower.split(/\s+/).length;
            
            if (wordCount > 0 && (suspiciousWords / wordCount) > 0.1) {
                return { 
                    isAdult: true, 
                    reason: 'High ratio of suspicious content',
                    ratio: (suspiciousWords / wordCount).toFixed(3),
                    confidence: 'medium'
                };
            }

            return { isAdult: false, reason: null };

        } catch (error) {
            console.error('Error in content filtering:', error);
            // If filtering fails, err on the side of caution
            return { isAdult: true, reason: 'Content filtering error', confidence: 'unknown' };
        }
    }

    // Check if URL is to an adult site
    isAdultURL(url) {
        try {
            if (!url) return { isAdult: false, reason: null };

            const urlLower = url.toLowerCase();
            
            // Check for blocked domains
            for (const domain of this.blockedDomains) {
                if (urlLower.includes(domain)) {
                    return { 
                        isAdult: true, 
                        reason: `Blocked domain: ${domain}`,
                        confidence: 'high'
                    };
                }
            }

            // Check for adult content patterns in URL
            for (const pattern of this.adultContentPatterns) {
                if (pattern.test(urlLower)) {
                    return { 
                        isAdult: true, 
                        reason: 'URL contains adult content patterns',
                        pattern: pattern.source,
                        confidence: 'high'
                    };
                }
            }

            return { isAdult: false, reason: null };

        } catch (error) {
            console.error('Error checking URL:', error);
            return { isAdult: true, reason: 'URL checking error', confidence: 'unknown' };
        }
    }

    // Count suspicious words in content
    countSuspiciousWords(content) {
        const suspiciousWords = [
            'adult', 'mature', 'explicit', 'erotic', 'intimate', 'sexual',
            'nude', 'naked', 'porn', 'xxx', 'sex', 'intimate'
        ];

        let count = 0;
        for (const word of suspiciousWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = content.match(regex);
            if (matches) {
                count += matches.length;
            }
        }

        return count;
    }

    // Validate file content (for text-based files)
    async validateFileContent(fileBuffer, mimeType) {
        try {
            // Only check text-based files
            if (!mimeType.includes('text') && !mimeType.includes('pdf')) {
                return { isValid: true, reason: null };
            }

            // Convert buffer to string for text files
            let content = '';
            if (mimeType.includes('text')) {
                content = fileBuffer.toString('utf-8');
            } else if (mimeType.includes('pdf')) {
                // For PDFs, we'll check the filename and rely on the document processor
                // The actual content will be checked after processing
                return { isValid: true, reason: null };
            }

            const filterResult = this.isAdultContent(content, 'file');
            return {
                isValid: !filterResult.isAdult,
                reason: filterResult.reason,
                confidence: filterResult.confidence
            };

        } catch (error) {
            console.error('Error validating file content:', error);
            return { isValid: false, reason: 'File validation error' };
        }
    }


}

export default ContentFilter;
