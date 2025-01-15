//TopicModeling.jsx
import React, { useState } from "react";
import { Upload, Loader2, Search } from "lucide-react";
import Header from "./dashboard/Header";
import { topicModelingService } from "../utils/axiosConfig";
import backgroundImage from "../assets/bg-main.jpg";
const TopicModeling = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState("");
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsLoading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        setLoadingState("Creating vector database...");
        const response = await topicModelingService.uploadDataset(formData);

        setLoadingState("Extracting topics...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setLoadingState("Analyzing topics...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setLoadingState("Generating embeddings...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setAnalysisResults(response.data);
        setIsLoading(false);
        setLoadingState("");
      } catch (error) {
        console.error("Error:", error);
        setAnalysisError(
          error.response?.data?.error || "Failed to upload dataset"
        );
        setIsLoading(false);
        setLoadingState("");
      }
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question) return;
    setIsLoading(true);
    setAnalysisError("");

    try {
      const response = await topicModelingService.enhancedCustomAnalysis({
        analysis_question: question,
      });

      setAnalysisResults((prevResults) => ({
        ...prevResults,
        analysis_results: {
          ...prevResults?.analysis_results,
          ...response.data.analysis_results,
        },
        numerical_analysis: {
          ...prevResults?.numerical_analysis,
          ...response.data.numerical_analysis,
        },
        analysis_components: {
          ...prevResults?.analysis_components,
          ...response.data.analysis_components,
        },
      }));

      setExpandedSection("results");
    } catch (error) {
      setAnalysisError(
        error.response?.data?.error ||
          "Failed to analyze question. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatText = (text) => {
    if (!text) return "";

    // Replace numbers with highlighted spans
    const withHighlightedNumbers = text.replace(
      /\b\d+(\.\d+)?%?\b/g,
      (match) => `<span class="text-blue-400 font-semibold">${match}</span>`
    );

    // Format markdown-style bold text
    const withBoldText = withHighlightedNumbers.replace(
      /\*\*(.*?)\*\*/g,
      '<span class="font-semibold text-blue-400">$1</span>'
    );

    return <div dangerouslySetInnerHTML={{ __html: withBoldText }} />;
  };

  // Format analysis results to add line breaks between sections
  const formatAnalysisResults = (results) => {
    if (typeof results !== "string") {
      return JSON.stringify(results, null, 2);
    }

    // Split into paragraphs and format each
    const paragraphs = results.split("\n").filter((p) => p.trim());

    return paragraphs.map((paragraph, idx) => (
      <div key={idx} className="mb-4">
        {formatText(paragraph)}
      </div>
    ));
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <Header />

      <div className="relative py-16 px-6 z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* File Upload Card */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-8 shadow-lg border border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Upload Dataset
              </h2>
              <label className="w-full max-w-2xl cursor-pointer">
                <div className="border-2 border-dashed border-emerald-500/40 rounded-xl p-8 text-center hover:border-emerald-400/60 transition-all hover:bg-emerald-900/10">
                  <Upload className="mx-auto h-12 w-12 text-emerald-400" />
                  <p className="mt-4 text-white font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    CSV or Excel files supported
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                </div>
              </label>

              {isLoading && (
                <div className="flex items-center gap-3 text-white mt-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">{loadingState}</span>
                </div>
              )}
            </div>
          </div>

          {analysisResults && (
            <div className="space-y-6">
              {/* Analysis Sections */}
              {["topic-analysis", "topic-cooccurrence"].map((section) => (
                <div
                  key={section}
                  className="bg-black/60 backdrop-blur-md rounded-xl shadow-lg border border-emerald-500/20 overflow-hidden"
                >
                  <button
                    className="w-full p-4 flex justify-between items-center bg-emerald-900/20 text-white hover:bg-emerald-900/30 transition-colors"
                    onClick={() => toggleSection(section)}
                  >
                    <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                      {section === "topic-analysis"
                        ? "Topic Analysis"
                        : "Topic Cooccurrence"}
                    </span>
                    <span
                      className={`transform transition-transform duration-200 ${
                        expandedSection === section ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {expandedSection === section && (
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-emerald-900/20 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                            <tr>
                              {section === "topic-analysis" ? (
                                <>
                                  <th className="text-left p-4">Topic</th>
                                  <th className="text-right p-4">Count</th>
                                  <th className="text-right p-4">Percentage</th>
                                </>
                              ) : (
                                <>
                                  <th className="text-left p-4">Topic Pair</th>
                                  <th className="text-right p-4">Count</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="text-white/90">
                            {section === "topic-analysis"
                              ? analysisResults.insights?.distribution_df?.map(
                                  (item, idx) => (
                                    <tr
                                      key={idx}
                                      className="border-t border-emerald-500/20 hover:bg-emerald-900/20"
                                    >
                                      <td className="p-4">{item.Topic}</td>
                                      <td className="text-right p-4">
                                        {item.Count}
                                      </td>
                                      <td className="text-right p-4">
                                        {item.Percentage}
                                      </td>
                                    </tr>
                                  )
                                )
                              : analysisResults.insights?.cooccurrence_df?.map(
                                  (item, idx) => (
                                    <tr
                                      key={idx}
                                      className="border-t border-emerald-500/20 hover:bg-emerald-900/20"
                                    >
                                      <td className="p-4">
                                        {item["Topic Pair"]}
                                      </td>
                                      <td className="text-right p-4">
                                        {item.Count}
                                      </td>
                                    </tr>
                                  )
                                )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Custom Analysis Section */}
              <div className="bg-black/60 backdrop-blur-md rounded-xl p-8 shadow-lg border border-emerald-500/20">
                <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6 text-center">
                  Custom Analysis
                </h2>
                <div className="flex gap-4 mb-6">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a detailed question about your data..."
                    className="flex-1 bg-black/40 border border-emerald-500/30 rounded-lg p-3 text-white placeholder-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    onClick={handleQuestionSubmit}
                    disabled={isLoading || !question}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#2c3e95]/90 to-[#3fa88e]/80 text-white hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                    Analyze
                  </button>
                </div>

                {analysisError && (
                  <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg">
                    {analysisError}
                  </div>
                )}
              </div>

              {/* Results Section */}
              {analysisResults.analysis_results && (
                <div className="bg-black/60 backdrop-blur-md rounded-xl shadow-lg border border-emerald-500/20 overflow-hidden">
                  <button
                    className="w-full p-4 flex justify-between items-center bg-emerald-900/20 text-white hover:bg-emerald-900/30 transition-colors"
                    onClick={() => toggleSection("results")}
                  >
                    <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                      Analysis Results
                    </span>
                    <span
                      className={`transform transition-transform duration-200 ${
                        expandedSection === "results" ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {expandedSection === "results" && (
                    <div className="p-6 space-y-6 text-white/90">
                      <div className="bg-emerald-900/20 p-6 rounded-lg">
                        <h4 className="font-semibold text-transparent bg-clip-text bg-emerald-400 mb-4">
                          Summary
                        </h4>
                        <div className="space-y-4">
                          {formatAnalysisResults(
                            analysisResults.analysis_results.summary
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="font-semibold text-transparent bg-clip-text bg-emerald-400">
                          Detailed Analysis
                        </h4>
                        {Object.entries(
                          analysisResults.analysis_results.detailed_analysis
                        ).map(([key, analysis], idx) => (
                          <div
                            key={idx}
                            className="bg-emerald-900/20 p-6 rounded-lg"
                          >
                            <h5 className="font-semibold text-blue-400 mb-4">
                              {analysis.question}
                            </h5>
                            <div className="space-y-4">
                              {formatAnalysisResults(analysis.results)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicModeling;
