import { useState } from 'react'
import { dataAnalysisService } from '../utils/axiosConfig'
import { Loader2, Upload, Save, Search } from 'lucide-react';

import Header from './dashboard/Header'
import backgroundImage from '../assets/bg-main.jpg';

export default function StructruredDataQuery() {
  const [file, setFile] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('file', file)

    try {
        // Axios automatically throws an error for non-200 status codes
        await dataAnalysisService.uploadFile(formData)
        
        setUploadStatus('File uploaded successfully! You can now analyze your data.')
        setFile(null)
      } catch (err) {
        // Axios error handling
        setError(
          err.response?.data?.error || 
          err.message || 
          'Error uploading file'
        )
      } finally {
        setLoading(false)
      }
    }

  const handleAnalysis = async (e) => {
    e.preventDefault()
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }

    setLoading(true)
    setError('')

    try {
        const { data } = await dataAnalysisService.analyzeData(query)
        setResults(data)
      } catch (err) {
        setError(
          err.response?.data?.error || 
          err.message || 
          'Error analyzing data'
        )
      } finally {
        setLoading(false)
      }
    }
  

  const handleSaveResults = async () => {
    if (!results?.results) return
    
    try {
        await dataAnalysisService.saveResults(results.results)
        alert('Results saved successfully!')
      } catch (err) {
        setError(
          err.response?.data?.error || 
          err.message || 
          'Error saving results'
        )
      }
    }

     // Format the explanation text
  const formatExplanation = (text) => {
    if (!text) return '';
    
    // Replace numbers with highlighted spans
    const withHighlightedNumbers = text.replace(
      /\b\d+(\.\d+)?%?\b/g, 
      match => `<span class="text-emerald-400 font-semibold">${match}</span>`
    );

    // Format markdown-style bold text
    const withBoldText = withHighlightedNumbers.replace(
      /\*\*(.*?)\*\*/g,
      '<span class="font-semibold">$1</span>'
    );

    return withBoldText;
  };

  return (
    <div 
              className="min-h-screen relative p-14"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            >
   <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div className="relative z-10">
        <Header />
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Data Analysis Dashboard</h1>
          
          {/* File Upload Section */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-8 shadow-lg border border-emerald-500/20 justify-center items-center">
          <div className='flex flex-col justify-center items-center'>
            <h2 className="text-xl font-semibold mb-6 text-blue-400 justify-center items-center">Upload Data</h2>
            </div>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <label className="block w-full cursor-pointer">
                <div className="border-2 border-dashed border-emerald-500/40 rounded-xl p-8 text-center hover:border-emerald-400/60 transition-all hover:bg-emerald-900/10">
                  <Upload className="mx-auto h-12 w-12 text-emerald-400 mb-4" />
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                  />
                  <p className="text-white font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-400 mt-2">CSV or Excel files supported</p>
                </div>
              </label>
              <div className='flex justify-center'>
              <button
                type="submit"
                disabled={loading}
                className=" bg-gradient-to-r from-[#2c3e95]/90 to-[#3fa88e]/80 text-white py-3 px-4 rounded-lg hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload
                  </>
                )}
              </button>
              </div>
            </form>
            {uploadStatus && (
              <p className="mt-4 text-emerald-400">{uploadStatus}</p>
            )}
          </div>

          {/* Query Section */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-8 shadow-lg border border-emerald-500/20">
          <div className='flex flex-col justify-center items-center'>
            <h2 className="text-xl font-semibold mb-6 text-blue-400">Analyze Data</h2>
            </div>
            <form onSubmit={handleAnalysis} className="space-y-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your query in natural language..."
                className="w-full p-4 border border-emerald-500/30 rounded-lg bg-black/40 text-white placeholder-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 h-32"
              />
              <div className='flex justify-center items-center'>
              <button
                type="submit"
                disabled={loading}
                className=" bg-gradient-to-r from-[#2c3e95]/90 to-[#3fa88e]/80 text-white py-3 px-4 rounded-lg hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Analyze
                  </>
                )}
              </button>
              </div>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div className="bg-black/60 backdrop-blur-md rounded-xl p-8 shadow-lg border border-emerald-500/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-blue-400">Results</h2>
                <button
                  onClick={handleSaveResults}
                  className="bg-gradient-to-r from-[#2c3e95]/90 to-[#3fa88e]/80 text-white py-2 px-4 rounded-lg hover:bg-emerald-500 flex items-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  Save Results
                </button>
              </div>
              
              {results.explanation && (
                <div className="mb-6 p-6 bg-emerald-900/10 rounded-lg border border-emerald-500/20">
                  <div 
                    dangerouslySetInnerHTML={{ __html: formatExplanation(results.explanation) }} 
                    className="text-white space-y-4" 
                  />
                </div>
              )}
              
              {results.query && (
                <div className="mb-6 p-6 bg-emerald-900/10 rounded-lg border border-emerald-500/20">
                  <h3 className="font-semibold mb-3 text-emerald-400">Generated Query:</h3>
                  <code className="block whitespace-pre-wrap text-white bg-black/40 p-4 rounded-lg border border-emerald-500/20">
                    {results.query}
                  </code>
                </div>
              )}
              
              {results.results && (
                <div className="overflow-x-auto rounded-lg border border-emerald-500/20">
                  <table className="min-w-full divide-y divide-emerald-500/20">
                    <thead className="bg-emerald-900/20">
                      <tr>
                        {Object.keys(results.results[0]).map((header) => (
                          <th
                            key={header}
                            className="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/20">
                      {results.results.map((row, idx) => (
                        <tr key={idx} className="hover:bg-emerald-900/10">
                          {Object.values(row).map((value, valueIdx) => (
                            <td key={valueIdx} className="px-6 py-4 whitespace-nowrap text-white">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
</div>
  )
}