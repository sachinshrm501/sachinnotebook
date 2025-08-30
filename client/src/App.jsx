import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Moon, 
  Sun, 
  Zap, 
  FileText, 
  Upload, 
  Mic, 
  Send, 
  Copy, 
  Check, 
  MessageCircle, 
  Globe, 
  Youtube, 
  Type, 
  Link, 
  Clock, 
  ThumbsUp, 
  ThumbsDown,
  User,
  Settings,
  Search,
  Trash2,
  Eye,
  BookOpen,
  Database,
  RefreshCw,
  ExternalLink,
  Video,
  Play,
  File
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('files')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  
  // New state for different source types
  const [websites, setWebsites] = useState([])
  const [youtubeLinks, setYoutubeLinks] = useState([])
  const [textInputs, setTextInputs] = useState([])
  const [newWebsite, setNewWebsite] = useState('')
  const [newYoutube, setNewYoutube] = useState('')
  const [newText, setNewText] = useState('')
  
  // Session state
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`)

  // New state for file upload loading
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isProcessingWebsite, setIsProcessingWebsite] = useState(false)
  const [isProcessingYoutube, setIsProcessingYoutube] = useState(false)
  const [isProcessingText, setIsProcessingText] = useState(false)
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' })

  // Message reaction state
  const [messageReactions, setMessageReactions] = useState({})

  // Scroll indicator state
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)

  // Mobile navigation state
  const [showMobileSources, setShowMobileSources] = useState(false)

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false)



  // Dark mode toggle function
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode))
    
    // Apply theme to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }



  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      const darkMode = JSON.parse(savedDarkMode)
      setIsDarkMode(darkMode)
      if (darkMode) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  // Debug useEffect to monitor messages state
  useEffect(() => {
    console.log('🔍 Messages state changed:', messages.length, 'messages')
    console.log('📋 Messages content:', messages)
    
    // Auto-scroll to bottom when new messages arrive
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }, [messages])

  // Add scroll event listener to detect when user scrolls up
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages')
    if (chatContainer) {
      const handleScroll = () => {
        const isAtBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 10
        setShowScrollIndicator(!isAtBottom && messages.length > 0)
      }
      
      chatContainer.addEventListener('scroll', handleScroll)
      return () => chatContainer.removeEventListener('scroll', handleScroll)
    }
  }, [messages.length])

  // Function to scroll chat to bottom
  const scrollToBottom = () => {
    const chatContainer = document.getElementById('chat-messages')
    if (chatContainer) {
      console.log('📜 Scrolling to bottom, container height:', chatContainer.scrollHeight)
      
      // Hide scroll indicator when scrolling
      setShowScrollIndicator(false)
      
      // Add visual feedback
      chatContainer.style.transition = 'scroll-behavior 0.3s ease'
      
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        // Use smooth scrolling if available
        try {
          chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
          })
        } catch (error) {
          console.log('📜 Smooth scroll failed, using instant scroll')
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
        
        // Fallback to instant scroll
        chatContainer.scrollTop = chatContainer.scrollHeight
        
        // Remove transition after scrolling
        setTimeout(() => {
          chatContainer.style.transition = ''
        }, 300)
      })
    } else {
      console.log('📜 Chat container not found')
    }
  }


  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId))
  }

  // Message reaction functions
  const handleMessageReaction = (messageId, reactionType) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [reactionType]: (prev[messageId]?.[reactionType] || 0) + 1
      }
    }))
    
    // Show feedback
    const reactionEmoji = reactionType === 'thumbsUp' ? '👍' : '👎'
    showPopup(`${reactionEmoji} Reaction added!`, 'success')
  }

  const copyMessage = async (messageId, messageText) => {
    try {
      await navigator.clipboard.writeText(messageText)
      setCopiedMessageId(messageId)
      showPopup('Message copied to clipboard!', 'success')
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      showPopup('Failed to copy message', 'error')
    }
  }



  const addWebsite = async () => {
    if (newWebsite.trim()) {
      setIsProcessingWebsite(true)
      showPopup('Processing website...', 'info')
      
      try {
        const website = {
          id: Date.now(),
          url: newWebsite
        }
        
        // Send to server
        const response = await fetch('http://localhost:3000/api/sources/websites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(website)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('Website processed successfully:', result)
          
          // Add to local state
          const newWebsiteItem = {
            id: result.website.id,
            url: newWebsite,
            addedAt: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          }
          setWebsites(prev => [...prev, newWebsiteItem])
          setNewWebsite('')
          showPopup(`Website "${newWebsite}" processed successfully!`, 'success')
        } else {
          const errorData = await response.json()
          showPopup(`Error processing website: ${errorData.error || 'Unknown error'}`, 'error')
        }
      } catch (error) {
        console.error('Error processing website:', error)
        showPopup(`Error processing website: ${error.message}`, 'error')
      } finally {
        setIsProcessingWebsite(false)
      }
    }
  }

  const removeWebsite = (websiteId) => {
    setWebsites(websites.filter(website => website.id !== websiteId))
  }

  const addYoutube = async () => {
    if (newYoutube.trim()) {
      setIsProcessingYoutube(true)
      showPopup('Processing YouTube video...', 'info')
      
      try {
        const youtubeData = {
          id: Date.now(),
          url: newYoutube
        }
        
        // Send to server
        const response = await fetch('http://localhost:3000/api/sources/youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(youtubeData)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('YouTube video processed successfully:', result)
          
          // Add to local state
          const newYoutubeItem = {
            id: result.youtube.id,
            url: newYoutube,
            addedAt: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          }
          setYoutubeLinks(prev => [...prev, newYoutubeItem])
          setNewYoutube('')
          showPopup(`YouTube video processed successfully!`, 'success')
        } else {
          const errorData = await response.json()
          showPopup(`Error processing YouTube video: ${errorData.error || 'Unknown error'}`, 'error')
        }
      } catch (error) {
        console.error('Error processing YouTube video:', error)
        showPopup(`Error processing YouTube video: ${error.message}`, 'error')
      } finally {
        setIsProcessingYoutube(false)
      }
    }
  }

  const removeYoutube = (youtubeId) => {
    setYoutubeLinks(youtubeLinks.filter(youtube => youtube.id !== youtubeId))
  }

  const addText = async () => {
    if (newText.trim()) {
      setIsProcessingText(true)
      showPopup('Processing text...', 'info')
      
      try {
        const textData = {
          id: Date.now(),
          content: newText
        }
        
        // Send to server
        const response = await fetch('http://localhost:3000/api/sources/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(textData)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('Text processed successfully:', result)
          
          // Add to local state
          const newTextItem = {
            id: result.text.id,
            content: newText,
            addedAt: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          }
          setTextInputs(prev => [...prev, newTextItem])
          setNewText('')
          showPopup('Text processed successfully!', 'success')
        } else {
          const errorData = await response.json()
          showPopup(`Error processing text: ${errorData.error || 'Unknown error'}`, 'error')
        }
      } catch (error) {
        console.error('Error processing text:', error)
        showPopup(`Error processing text: ${error.message}`, 'error')
      } finally {
        setIsProcessingText(false)
      }
    }
  }

  const removeText = (textId) => {
    setTextInputs(textInputs.filter(text => text.id !== textId))
  }

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      console.log('🚀 Starting to send message:', inputValue)
      console.log('📊 Current messages count:', messages.length)
      
      const newMessage = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: inputValue,
        sender: 'user',
        timestamp: new Date().toLocaleString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      }
      
      console.log('👤 Adding user message:', newMessage)
      setMessages(prev => {
        console.log('📝 Previous messages:', prev.length)
        const updated = [...prev, newMessage]
        console.log('📝 Updated messages count:', updated.length)
        return updated
      })
      
      // Scroll to bottom after adding user message
      setTimeout(() => scrollToBottom(), 50)
      
      setInputValue('')
      setIsThinking(true)
      
      try {
        console.log('🔍 Searching knowledge base...')
        // Search the vector store for relevant content
        const response = await fetch('http://localhost:3000/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: inputValue,
            limit: 3,
            sessionId: sessionId
          })
        })
        
        if (response.ok) {
          const searchResult = await response.json()
          console.log('✅ Search successful:', searchResult)
          
          // Use the AI-generated response from server
          const aiMessage = {
            id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: searchResult.response,
            sender: 'ai',
            timestamp: new Date().toLocaleString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          }
          
          console.log('🤖 Adding AI message:', aiMessage)
          // Add the message to the list immediately (no typing animation)
          setMessages(prev => {
            console.log('🤖 Previous messages before AI:', prev.length)
            const updated = [...prev, aiMessage]
            console.log('🤖 Updated messages count after AI:', updated.length)
            return updated
          })
          
          // Scroll to bottom immediately after adding AI message
          setTimeout(() => scrollToBottom(), 50)
        } else {
          const errorData = await response.json()
          console.log('❌ Search failed:', errorData)
          
          const errorMessage = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: `Sorry, I encountered an error while searching your knowledge base: ${errorData.error || 'Unknown error'}. Please try again or check if you have any sources uploaded.`,
            sender: 'ai',
            timestamp: new Date().toLocaleString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          }
          console.log('❌ Adding error message:', errorMessage)
          setMessages(prev => [...prev, errorMessage])
          // Scroll to bottom after adding error message
          setTimeout(() => scrollToBottom(), 50)
        }
      } catch (error) {
        console.log('💥 Exception occurred:', error)
        const errorMessage = {
          id: `conn_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: 'Sorry, I couldn\'t connect to your knowledge base. Please check if your server is running and try again.',
          sender: 'ai',
          timestamp: new Date().toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        }
        console.log('💥 Adding connection error message:', errorMessage)
        setMessages(prev => [...prev, errorMessage])
        // Scroll to bottom after adding connection error message
        setTimeout(() => scrollToBottom(), 50)
      } finally {
        console.log('🏁 Finishing message processing')
        setIsThinking(false)
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // New chat functionality
  const startNewChat = () => {
    // If there are existing messages, ask for confirmation
    if (messages.length > 0) {
      const confirmed = window.confirm('Are you sure you want to start a new chat? This will clear all current messages.')
      if (!confirmed) {
        return
      }
    }
    
    // Clear all conversation data
    setMessages([])
    setInputValue('')
    setIsThinking(false)
    
    // Generate new session ID for fresh conversation
    const newSessionId = `session_${Date.now()}`
    setSessionId(newSessionId)
    
    console.log('New chat session started:', newSessionId)
  }

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'files': return <FileText className="w-4 h-4" />
      case 'website': return <Globe className="w-4 h-4" />
      case 'youtube': return <Youtube className="w-4 h-4" />
      case 'text': return <Type className="w-4 h-4" />
      default: return <X className="w-4 h-4" />
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'files':
        return (
          <>
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center mb-4 sm:mb-6 hover:border-blue-400 transition-colors">
              {isProcessingFile ? (
                <>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-blue-600 mb-2 text-base sm:text-lg font-medium">
                    Processing files...
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Please wait while we process your files
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
                    <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                    <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400" />
                  </div>
                  <p className="text-gray-600 mb-2 text-base sm:text-lg">
                    Upload PDF, CSV, Word documents, or text files
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                    Maximum file size: 5MB
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                    Supported: .pdf, .csv, .doc, .docx, .txt
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.csv,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isProcessingFile}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base ${
                      isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Choose Files
                  </label>
                </>
              )}
            </div>

            {/* Uploaded Files or Empty State */}
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file) => (
                <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <File className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-500">Uploaded: {file.uploadedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                      title="View file"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-base sm:text-lg mb-2">No files uploaded yet</p>
                <p className="text-gray-400 text-xs sm:text-sm max-w-xs mx-auto">
                  Upload files to get started with AI-powered insights
                </p>
              </div>
            )}
          </>
        )

      case 'website':
        return (
          <>
            {/* Website Input Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center mb-4 sm:mb-6 hover:border-blue-400 transition-colors">
              <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-600 mb-2 text-base sm:text-lg">
                Add website URLs to analyze with AI
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                Enter a website URL below to get started
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 max-w-md mx-auto">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    disabled={isProcessingWebsite}
                  />
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                <button
                  onClick={addWebsite}
                  disabled={!newWebsite.trim() || isProcessingWebsite}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {isProcessingWebsite ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Website</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Added Websites */}
            {websites.length > 0 ? (
              websites.map((website) => (
                <div key={website.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-800 break-all">{website.url}</p>
                      <p className="text-xs text-gray-500">Added: {website.addedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => removeWebsite(website.id)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                      title="View website"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeWebsite(website.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Remove website"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-base sm:text-lg mb-2">No websites added yet</p>
                <p className="text-gray-400 text-xs sm:text-sm max-w-xs mx-auto">
                  Add website URLs to analyze with AI
                </p>
              </div>
            )}
          </>
        )

      case 'youtube':
        return (
          <>
            {/* YouTube Input Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center mb-4 sm:mb-6 hover:border-blue-400 transition-colors">
              <Youtube className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-600 mb-2 text-base sm:text-lg">
                Add YouTube video URLs to analyze with AI
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                Enter a YouTube video URL below to get started
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 max-w-md mx-auto">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={newYoutube}
                    onChange={(e) => setNewYoutube(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                  <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                <button
                  onClick={addYoutube}
                  disabled={!newYoutube.trim() || isProcessingYoutube}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {isProcessingYoutube ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add YouTube</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Added YouTube Links */}
            {youtubeLinks.length > 0 ? (
              youtubeLinks.map((youtube) => (
                <div key={youtube.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-800 break-all">{youtube.url}</p>
                      <p className="text-xs text-gray-500">Added: {youtube.addedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => removeYoutube(youtube.id)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                      title="View video"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeYoutube(youtube.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Remove video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Youtube className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-base sm:text-lg mb-2">No YouTube videos added yet</p>
                <p className="text-gray-400 text-xs sm:text-sm max-w-xs mx-auto">
                  Add YouTube video URLs to analyze with AI
                </p>
              </div>
            )}
          </>
        )

      case 'text':
        return (
          <>
            {/* Text Input Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center mb-4 sm:mb-6 hover:border-blue-400 transition-colors">
              <Type className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-600 mb-2 text-base sm:text-lg">
                Add text content to analyze with AI
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                Enter or paste text content below to get started
              </p>
              <div className="max-w-md mx-auto space-y-3">
                <div className="relative">
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter your text here..."
                    rows="4"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
                  />
                  <Type className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                </div>
                <button
                  onClick={addText}
                  disabled={!newText.trim() || isProcessingText}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {isProcessingText ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Added Text Inputs */}
            {textInputs.length > 0 ? (
              textInputs.map((textInput) => (
                <div key={textInput.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      <span className="text-xs text-gray-500">Added: {textInput.addedAt}</span>
                    </div>
                                      <div className="flex items-center space-x-2">
                    <button
                      onClick={() => removeText(textInput.id)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                      title="View text"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeText(textInput.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Remove text"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-800 line-clamp-3">{textInput.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Type className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-base sm:text-lg mb-2">No text content added yet</p>
                <p className="text-gray-400 text-xs sm:text-sm max-w-xs mx-auto">
                  Add text content to analyze with AI
                </p>
              </div>
            )}
          </>
        )

      default:
        return null
    }
  }

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'n') {
        e.preventDefault();
        startNewChat();
      }
    }
  };

  // Show popup notification
  const showPopup = (message, type = 'success') => {
    setPopup({ show: true, message, type })
    setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 3000)
  }

  // Popup Component
  const PopupNotification = () => {
    if (!popup.show) return null

    let bgColor = 'bg-green-500'
    let icon = '✓'
    
    if (popup.type === 'error') {
      bgColor = 'bg-red-500'
      icon = '✗'
    } else if (popup.type === 'info') {
      bgColor = 'bg-blue-500'
      icon = 'ℹ'
    }

    return (
      <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 animate-slide-in popup-notification`}>
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{popup.message}</span>
        <button 
          onClick={() => setPopup({ show: false, message: '', type: 'success' })}
          className="ml-4 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    )
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    
    if (files.length === 0) return
    
    setIsProcessingFile(true)
    showPopup(`Processing ${files.length} file(s)...`, 'info')
    
    files.forEach(async (file) => {
      try {
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('files', file)
        
        // Send file to server
        const response = await fetch('http://localhost:3000/api/sources/files', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // Add to local state
          const newFile = {
            id: result.processed[0]?.filename || Date.now(),
            name: file.name,
            type: file.type.split('/')[1],
            uploadedAt: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          }
          setUploadedFiles(prev => [...prev, newFile])
          showPopup(`File "${file.name}" processed successfully!`, 'success')
        } else {
          const errorData = await response.json()
          showPopup(`Error processing "${file.name}": ${errorData.error || 'Unknown error'}`, 'error')
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        showPopup(`Error processing "${file.name}": ${error.message}`, 'error')
      }
    })
    
    // Reset loading state after all files are processed
    setTimeout(() => setIsProcessingFile(false), 1000)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white dark' : 'bg-white text-gray-900'}`} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header */}
      <header className={`border-b transition-colors duration-300 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`}>SachinNotebook</h1>
                      <div className="flex items-center space-x-4">
              {/* User Profile Button */}
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              {/* Settings Button */}
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors theme-toggle"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Mobile Navigation Toggle */}
        <div className={`lg:hidden flex items-center justify-between p-4 border-b transition-colors duration-300 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={() => setShowMobileSources(!showMobileSources)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>{showMobileSources ? 'Hide' : 'Show'} Sources</span>
          </button>
          <div className="text-sm text-gray-600">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </div>
        </div>
        
        {/* Left Panel - Sources */}
        <div className={`w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r transition-colors duration-300 p-4 sm:p-6 overflow-y-auto ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        } ${showMobileSources ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center space-x-3 mb-6">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h2 className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Sources</h2>
          </div>
          
          {/* Source Type Tabs */}
          <div className="flex space-x-1 mb-6">
            {['files', 'website', 'youtube', 'text'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize flex items-center space-x-2 transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {getTabIcon(tab)}
                <span>{tab}</span>
              </button>
            ))}
            <button 
              onClick={startNewChat}
              title="Start a new chat session (Ctrl+N)"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>

        {/* Right Panel - Chat */}
        <div className={`w-full lg:w-1/2 p-4 sm:p-6 flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Chat</h2>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center space-x-1">
                <Database className="w-3 h-3" />
                <span>Session: {sessionId.split('_')[1]}</span>
              </div>
              <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded flex items-center space-x-1">
                <MessageCircle className="w-3 h-3" />
                <span>Messages: {messages.length}</span>
              </div>
              <button
                onClick={scrollToBottom}
                title="Scroll to bottom"
                className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Scroll</span>
              </button>
            </div>
          </div>
          <p className={`transition-colors duration-300 mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ask questions about your uploaded sources</p>
          
          {/* Chat Messages */}
          <div className="flex-1 space-y-4 mb-6 overflow-y-auto max-h-96 scroll-smooth" id="chat-messages">
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in message-enter`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`px-4 py-3 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md message-bubble-hover ${
                      message.sender === 'user'
                        ? 'max-w-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white transform hover:scale-105'
                        : 'w-full max-w-4xl bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200 transform hover:scale-105'
                    }`}
                  >
                    {/* Message Content */}
                    <div className="text-sm leading-relaxed">
                      {message.text}
                    </div>
                    
                    {/* Enhanced Timestamp with Status */}
                    <div className={`text-xs mt-2 flex items-center justify-between ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{message.timestamp}</span>
                      </div>
                      
                      {/* Message Status Indicator */}
                      {message.sender === 'user' && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs">Sent</span>
                        </div>
                      )}
                      
                      {message.sender === 'ai' && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-xs">AI</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Source Attribution for AI Responses */}
                    {message.sender === 'ai' && message.sources && (
                                              <div className="mt-2 pt-2 border-t border-gray-200 animate-fade-in">
                          <div className="text-xs text-gray-500 flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>Sources: {message.sources.join(', ')}</span>
                          </div>
                        </div>
                    )}
                    
                    {/* Message Actions */}
                    <div className="mt-2 pt-2 border-t border-gray-200 opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <div className="flex items-center justify-between">
                        {/* Reaction Counters */}
                        {messageReactions[message.id] && (
                          <div className="flex items-center space-x-2">
                            {messageReactions[message.id].thumbsUp > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <ThumbsUp className="w-3 h-3" />
                                <span>{messageReactions[message.id].thumbsUp}</span>
                              </div>
                            )}
                            {messageReactions[message.id].thumbsDown > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                <ThumbsDown className="w-3 h-3" />
                                <span>{messageReactions[message.id].thumbsDown}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          {message.sender === 'ai' && (
                            <>
                              <button 
                                onClick={() => copyMessage(message.id, message.text)}
                                className={`text-xs p-1 rounded transition-all duration-200 ${
                                  copiedMessageId === message.id 
                                    ? 'text-green-500 bg-green-50' 
                                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                                }`}
                                title="Copy message"
                              >
                                {copiedMessageId === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button 
                                onClick={() => handleMessageReaction(message.id, 'thumbsUp')}
                                className="text-xs text-gray-400 hover:text-green-500 transition-colors p-1 rounded hover:bg-green-50 group reaction-button"
                                title="Thumbs up"
                              >
                                <ThumbsUp className="w-3 h-3 group-hover:scale-110 transition-transform" />
                              </button>
                              <button 
                                onClick={() => handleMessageReaction(message.id, 'thumbsDown')}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 group reaction-button"
                                title="Thumbs down"
                              >
                                <ThumbsDown className="w-3 h-3 group-hover:scale-110 transition-transform" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                <div className="relative">
                  <MessageCircle className="w-20 h-20 text-gray-300 mb-4 animate-bounce floating" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-xs">✨</span>
                  </div>
                </div>
                <p className="text-gray-500 text-xl mb-2 font-medium">Start a conversation</p>
                <p className="text-gray-400 text-sm max-w-xs">
                  Upload sources and ask questions to get AI-powered insights
                </p>
              </div>
            )}
            
            {/* Enhanced Thinking Indicator */}
            {isThinking && (
              <div className="flex justify-start animate-slide-in">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 px-4 py-3 rounded-lg flex items-center space-x-3 border border-blue-200 shadow-sm">
                  <div className="relative">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-ping"></div>
                  </div>
                  <div className="flex space-x-1">
                    <span className="animate-pulse">Searching</span>
                    <span className="animate-pulse delay-100">your</span>
                    <span className="animate-pulse delay-200">knowledge</span>
                    <span className="animate-pulse delay-300">base</span>
                    <span className="animate-pulse delay-500">...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Typing Indicator */}
            {isThinking && (
              <div className="flex justify-start animate-slide-in">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-sm text-gray-600 ml-2">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}
            

          </div>

          {/* Scroll Indicator */}
          {showScrollIndicator && (
            <div className="mb-4 text-center">
              <button
                onClick={scrollToBottom}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center space-x-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>New messages - Click to scroll down</span>
              </button>
            </div>
          )}


          {/* Chat Input */}
          <div className="flex items-center space-x-3 mt-auto">
            <div className="flex-1 relative group focus-animation">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your sources..."
                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-400 group-hover:shadow-md ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
                disabled={isThinking}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {/* Voice input button with animation */}
                <button className="text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110 group/voice">
                  <div className="relative">
                    <Mic className="w-5 h-5 group-hover/voice:animate-pulse" />
                    <div className="absolute inset-0 w-5 h-5 bg-blue-100 rounded-full opacity-0 group-hover/voice:opacity-100 group-hover/voice:animate-ping"></div>
                  </div>
                </button>
                
                {/* Character count indicator */}
                {inputValue.length > 0 && (
                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full animate-fade-in">
                    {inputValue.length}/500
                  </div>
                )}
              </div>
              
              {/* Input focus indicator */}
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-focus-within:w-full"></div>
            </div>
            
            {/* Enhanced send button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isThinking}
              className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 group"
            >
              {/* Button background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Button content */}
              <div className="relative flex items-center space-x-2">
                <Send className="w-4 h-4 group-hover:animate-bounce" />
                <span className="font-medium">Send</span>
              </div>
              
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 group-active:opacity-30 transition-opacity duration-300"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
      <PopupNotification />
      
      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowMobileSources(!showMobileSources)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center hover:scale-110"
        >
          {showMobileSources ? (
            <X className="w-6 h-6" />
          ) : (
            <BookOpen className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  )
}

export default App

