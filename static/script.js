document.addEventListener('DOMContentLoaded', () => {
    const analysisForm = document.getElementById('analysisForm');
    const medicalImageInput = document.getElementById('medicalImage');
    const imagePreview = document.getElementById('imagePreview');
    const noImageText = document.getElementById('noImageText');
    const aiAnalysisOutput = document.getElementById('aiAnalysisOutput');
    const visualFindingsOutput = document.getElementById('visualFindingsOutput');
    const mostLikelyOutput = document.getElementById('mostLikelyOutput'); // New element
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsSection = document.getElementById('resultsSection');
    const analyzeBtn = document.getElementById('analyzeBtn');

    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarIcon = sidebarToggle.querySelector('.sidebar-icon');
    const pastAnalysesList = document.getElementById('pastAnalysesList');
    const noHistoryMessage = pastAnalysesList.querySelector('.no-history');

    // --- Sidebar Functionality ---
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        // Toggle icon based on sidebar state
        if (sidebar.classList.contains('collapsed')) {
            sidebarIcon.classList.remove('fa-bars');
            sidebarIcon.classList.add('fa-chevron-right');
        } else {
            sidebarIcon.classList.remove('fa-chevron-right');
            sidebarIcon.classList.add('fa-bars');
        }
    });

    // --- Image Preview ---
    medicalImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file size and type immediately on client-side
            const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'];
            const maxSizeBytes = 10 * 1024 * 1024; // 10MB

            const fileExt = file.name.split('.').pop().toLowerCase();
            if (!allowedExtensions.includes(fileExt)) {
                alert(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
                medicalImageInput.value = ''; // Clear input
                imagePreview.style.display = 'none';
                noImageText.style.display = 'block';
                return;
            }
            if (file.size > maxSizeBytes) {
                alert(`File too large. Maximum size: ${maxSizeBytes / (1024 * 1024)}MB`);
                medicalImageInput.value = ''; // Clear input
                imagePreview.style.display = 'none';
                noImageText.style.display = 'block';
                return;
            }


            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                noImageText.style.display = 'none';
            };
            reader.onerror = (e) => {
                console.error("FileReader error:", e);
                alert("Could not read image file. It might be corrupted or unsupported.");
                imagePreview.style.display = 'none';
                noImageText.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.src = '#';
            imagePreview.style.display = 'none';
            noImageText.style.display = 'block';
        }
    });

    // --- Form Submission (AJAX) ---
    analysisForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Reset display states before showing loading
        aiAnalysisOutput.innerHTML = '<p class="placeholder">AI analysis will appear here after submission.</p>';
        visualFindingsOutput.innerHTML = '<p class="placeholder">Specific locations of findings and their importance will appear here.</p>';
        mostLikelyOutput.innerHTML = '<i class="fas fa-notes-medical"></i> <span class="most-likely-text">Most Likely Diagnosis: Awaiting analysis...</span>'; // Reset new section
        imagePreview.src = '#';
        imagePreview.style.display = 'none';
        noImageText.style.display = 'block';

        resultsSection.style.display = 'block'; // Show results section
        loadingSpinner.style.display = 'flex'; // Show loading spinner
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

        const formData = new FormData(analysisForm);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                // Display analysis results
                aiAnalysisOutput.innerHTML = data.aiAnalysis;
                if (data.imagePreview) {
                    imagePreview.src = `data:image/jpeg;base64,${data.imagePreview}`;
                    imagePreview.style.display = 'block';
                    noImageText.style.display = 'none';
                }

                // Extract and display Visual Annotation Points
                const visualAnnotationText = extractSection(data.aiAnalysis, "### 6. Visual Annotation Points & Clinical Importance (Textual Description)");
                if (visualAnnotationText.trim()) {
                    visualFindingsOutput.innerHTML = visualAnnotationText;
                } else {
                    visualFindingsOutput.innerHTML = '<p class="placeholder">No specific discrete points for visual annotation were identified by the AI.</p>';
                }

                // Extract and display Most Likely Diagnosis
                const primaryDiagnosis = extractPrimaryDiagnosis(data.aiAnalysis);
                mostLikelyOutput.innerHTML = `<i class="fas fa-notes-medical"></i> <span class="most-likely-text">Most Likely Diagnosis: <strong>${primaryDiagnosis}</strong></span>`;


                // Save analysis to local storage
                saveAnalysisToHistory({
                    summary: primaryDiagnosis, // Use primary diagnosis for sidebar summary
                    timestamp: new Date().toLocaleString(),
                    patientHistory: data.patientHistory || 'No history provided',
                    referralNotes: data.referralNotes || 'No notes provided',
                    aiAnalysis: data.aiAnalysis,
                    imagePreview: data.imagePreview // Store base64 for re-display
                });

                // Scroll to results section for better UX
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            } else {
                // Display error message
                aiAnalysisOutput.innerHTML = `<p class="error-message"><i class="fas fa-exclamation-circle"></i> Error: ${data.error || 'Something went wrong.'}</p>`;
                visualFindingsOutput.innerHTML = `<p class="error-message">Error in analysis: ${data.error || 'Please try again.'}</p>`;
                mostLikelyOutput.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span class="most-likely-text">Analysis failed: ${data.error || 'Unknown error'}</span>`;
                console.error('Analysis error:', data.error);
                // If there's an error, don't show the image preview from the server
                imagePreview.style.display = 'none';
                noImageText.style.display = 'block';
            }
        } catch (error) {
            aiAnalysisOutput.innerHTML = `<p class="error-message"><i class="fas fa-exclamation-circle"></i> An unexpected error occurred: ${error.message}</p>`;
            visualFindingsOutput.innerHTML = `<p class="error-message">An unexpected error occurred: ${error.message}</p>`;
            mostLikelyOutput.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span class="most-likely-text">Error: ${error.message}</span>`;
            console.error('Fetch error:', error);
            imagePreview.style.display = 'none';
            noImageText.style.display = 'block';
        } finally {
            loadingSpinner.style.display = 'none'; // Hide loading spinner
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-flask"></i> Analyze Image';
            analysisForm.reset(); // Clear the form after submission
            // Image preview state is handled by success/error blocks for the loaded image
            // and then reset by medicalImageInput change event for a new upload
        }
    });

    // --- Helper to extract specific sections from AI analysis ---
    function extractSection(fullText, sectionHeading) {
        // Escape special characters in the heading for regex
        const escapedHeading = sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Regex to find the section heading and capture everything until the next heading or end of string
        const regex = new RegExp(`${escapedHeading}\\n([\\s\\S]*?)(?=\\n###|$)`, 'i');
        const match = fullText.match(regex);
        return match && match[1] ? match[1].trim() : '';
    }

    // --- Helper to extract Primary Diagnosis ---
    function extractPrimaryDiagnosis(aiAnalysisText) {
        // Look for "Primary Diagnosis:"
        let match = aiAnalysisText.match(/Primary Diagnosis:\s*([^\n]+)/i);
        if (match && match[1]) {
            return match[1].trim();
        }

        // Fallback 1: Look for "Provide primary diagnosis with confidence level." followed by a list item
        // This regex looks for "Diagnostic Assessment" heading, then tries to find a line starting with '-'
        // which follows "Provide primary diagnosis with confidence level."
        match = aiAnalysisText.match(/### 3\. Diagnostic Assessment[\s\S]*?- Provide primary diagnosis with confidence level\.?\s*\n\s*-\s*([^\n]+)/i);
        if (match && match[1]) {
            return match[1].trim();
        }

        // Fallback 2: Look for any strong text after "Diagnostic Assessment" section heading
        // This is a broader match, assuming the first relevant info is bolded after that section
        match = aiAnalysisText.match(/### 3\. Diagnostic Assessment[\s\S]*?\n\s*\*([^*]+)\*?/i); // Captures text inside first ** ** after heading
         if (match && match[1]) {
            return match[1].trim();
        }

        return "Undetermined"; // Default if no clear diagnosis found
    }

    // --- Past Analyses History (Local Storage) ---
    const MAX_HISTORY_ITEMS = 10; // Limit the number of stored analyses

    function getAnalysisHistory() {
        try {
            const history = localStorage.getItem('medicalAnalysisHistory');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error("Failed to parse analysis history from localStorage:", e);
            return [];
        }
    }

    function saveAnalysisHistory(history) {
        try {
            localStorage.setItem('medicalAnalysisHistory', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save analysis history to localStorage:", e);
            alert("Warning: Could not save analysis history to your browser's local storage.");
        }
    }

    function saveAnalysisToHistory(analysis) {
        const history = getAnalysisHistory();
        history.unshift(analysis); // Add new analysis to the beginning

        // Keep only the latest N items
        if (history.length > MAX_HISTORY_ITEMS) {
            history.splice(MAX_HISTORY_ITEMS);
        }
        saveAnalysisHistory(history);
        renderPastAnalyses(); // Re-render the list
    }

    function renderPastAnalyses() {
        const history = getAnalysisHistory();
        pastAnalysesList.innerHTML = ''; // Clear existing list

        if (history.length === 0) {
            noHistoryMessage.style.display = 'block';
            pastAnalysesList.appendChild(noHistoryMessage);
            return;
        } else {
            noHistoryMessage.style.display = 'none';
        }

        history.forEach((analysis, index) => {
            const listItem = document.createElement('li');
            listItem.dataset.index = index; // Store index to retrieve data
            listItem.innerHTML = `
                <span class="summary-text">${analysis.summary}</span>
                <small class="timestamp-text">${analysis.timestamp}</small>
                <button class="delete-btn" title="Delete this analysis"><i class="fas fa-times-circle"></i></button>
            `;
            // Add a more descriptive title for better UX
            listItem.title = `Analysis: ${analysis.summary} from ${analysis.timestamp}`;

            listItem.addEventListener('click', (event) => {
                // Check if the click was on the delete button
                if (event.target.closest('.delete-btn')) {
                    return; // Let the delete handler take care of it
                }
                loadPastAnalysis(index);
                // Highlight the active item
                document.querySelectorAll('.past-analyses-list li').forEach(item => item.classList.remove('active'));
                listItem.classList.add('active');
            });

            // Delete button functionality
            listItem.querySelector('.delete-btn').addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the parent <li> click event from firing
                deleteAnalysisFromHistory(index);
            });

            pastAnalysesList.appendChild(listItem);
        });
    }

    function loadPastAnalysis(index) {
        const history = getAnalysisHistory();
        if (index >= 0 && index < history.length) {
            const analysis = history[index];

            resultsSection.style.display = 'block';
            loadingSpinner.style.display = 'none';

            // Load patient history and referral notes back into form for context
            document.getElementById('patientHistory').value = analysis.patientHistory;
            document.getElementById('referralNotes').value = analysis.referralNotes;

            aiAnalysisOutput.innerHTML = analysis.aiAnalysis;
            const visualAnnotationText = extractSection(analysis.aiAnalysis, "### 6. Visual Annotation Points & Clinical Importance (Textual Description)");
            if (visualAnnotationText.trim()) {
                visualFindingsOutput.innerHTML = visualAnnotationText;
            } else {
                visualFindingsOutput.innerHTML = '<p class="placeholder">No specific discrete points for visual annotation were identified by the AI.</p>';
            }

            // Load Most Likely Diagnosis
            const primaryDiagnosis = extractPrimaryDiagnosis(analysis.aiAnalysis);
            mostLikelyOutput.innerHTML = `<i class="fas fa-notes-medical"></i> <span class="most-likely-text">Most Likely Diagnosis: <strong>${primaryDiagnosis}</strong></span>`;


            if (analysis.imagePreview) {
                imagePreview.src = `data:image/jpeg;base64,${analysis.imagePreview}`;
                imagePreview.style.display = 'block';
                noImageText.style.display = 'none';
            } else {
                imagePreview.src = '#';
                imagePreview.style.display = 'none';
                noImageText.style.display = 'block';
            }

            // Scroll to results section for better UX
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function deleteAnalysisFromHistory(index) {
        if (confirm('Are you sure you want to delete this analysis history item?')) {
            const history = getAnalysisHistory();
            if (index >= 0 && index < history.length) {
                // Check if the currently displayed analysis is being deleted
                const currentActiveItem = document.querySelector('.past-analyses-list li.active');
                let wasActive = false;
                if (currentActiveItem && parseInt(currentActiveItem.dataset.index) === index) {
                    wasActive = true;
                }

                history.splice(index, 1); // Remove item at index
                saveAnalysisHistory(history);
                renderPastAnalyses(); // Re-render the list

                // If the deleted item was active, clear the main display
                if (wasActive) {
                    aiAnalysisOutput.innerHTML = '<p class="placeholder">AI analysis will appear here after submission.</p>';
                    visualFindingsOutput.innerHTML = '<p class="placeholder">Specific locations of findings and their importance will appear here.</p>';
                    mostLikelyOutput.innerHTML = '<i class="fas fa-notes-medical"></i> <span class="most-likely-text">Most Likely Diagnosis: Awaiting analysis...</span>'; // Clear new section
                    imagePreview.src = '#';
                    imagePreview.style.display = 'none';
                    noImageText.style.display = 'block';
                    document.getElementById('patientHistory').value = '';
                    document.getElementById('referralNotes').value = '';
                }
            }
        }
    }

    // Initial render of past analyses on page load
    renderPastAnalyses();
});