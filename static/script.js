document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    const analysisForm = document.getElementById('analysisForm');
    const medicalImageInput = document.getElementById('medicalImage');
    const imagePreview = document.getElementById('imagePreview');
    const noImageText = document.getElementById('noImageText');
    const aiAnalysisOutput = document.getElementById('aiAnalysisOutput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsSection = document.getElementById('resultsSection');
    const pastAnalysesList = document.getElementById('pastAnalysesList');
    const mostLikelySection = document.getElementById('mostLikelySection');
    const mostLikelyDiagnosis = document.getElementById('mostLikelyDiagnosis');
    const visualFindingsOutput = document.getElementById('visualFindingsOutput');

    // History (using localStorage for simplicity - client-side only)
    let analysisHistory = JSON.parse(localStorage.getItem('analysisHistory')) || [];

    // Function to render history from the analysisHistory array
    function renderHistory() {
        pastAnalysesList.innerHTML = ''; // Clear existing list
        if (analysisHistory.length === 0) {
            pastAnalysesList.innerHTML = '<p class="no-history">No analysis history yet.</p>';
            return;
        }

        // Keep track of the active item's summary text to re-activate it after re-render
        const currentActiveSummary = document.querySelector('.past-analyses-list li.active span.summary-text')?.textContent;

        analysisHistory.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.dataset.index = index; // Store array index for easy lookup
            listItem.innerHTML = `
                <span class="summary-text">${item.summary}</span>
                <small class="timestamp-text">${new Date(item.timestamp).toLocaleString()}</small>
                <button class="delete-btn" data-index="${index}"><i class="fas fa-times-circle"></i></button>
            `;
            // Re-add active state if summary matches (for re-rendering after collapse/expand)
            if (item.summary === currentActiveSummary) {
                listItem.classList.add('active');
            }
            pastAnalysesList.appendChild(listItem);
        });

        // Add event listeners for newly created list items
        addHistoryItemListeners();
    }

    // Function to add click listeners to history items
    function addHistoryItemListeners() {
        document.querySelectorAll('.past-analyses-list li').forEach(item => {
            item.addEventListener('click', (event) => {
                // Check if the click was specifically on the delete button
                if (event.target.closest('.delete-btn')) {
                    const indexToDelete = parseInt(event.target.closest('.delete-btn').dataset.index);
                    deleteAnalysisHistoryItem(indexToDelete);
                } else {
                    const index = parseInt(item.dataset.index);
                    loadAnalysis(index);
                }
            });
        });
    }

    // Function to delete an analysis history item
    function deleteAnalysisHistoryItem(index) {
        const confirmDelete = confirm("Are you sure you want to delete this analysis?");
        if (confirmDelete) {
            analysisHistory.splice(index, 1); // Remove item from array
            localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory)); // Update localStorage
            renderHistory(); // Re-render history list to reflect deletion
            // If the deleted item was currently active, clear the results area
            if (document.querySelector('.past-analyses-list li.active')?.dataset.index == index) {
                clearResults();
            }
        }
    }

    // Function to load and display a past analysis from history
    function loadAnalysis(index) {
        const item = analysisHistory[index];
        if (item) {
            // Remove 'active' class from all other items and add to the clicked one
            document.querySelectorAll('.past-analyses-list li').forEach(li => li.classList.remove('active'));
            document.querySelector(`.past-analyses-list li[data-index="${index}"]`).classList.add('active');

            // Populate the main analysis display area
            aiAnalysisOutput.innerHTML = item.aiAnalysis;
            aiAnalysisOutput.classList.remove('placeholder');

            // Display image preview
            imagePreview.src = `data:image/jpeg;base64,${item.imagePreview}`;
            imagePreview.style.display = 'block';
            noImageText.style.display = 'none';

            // Extract and display Most Likely Diagnosis (using basic regex for demonstration)
            const diagnosisMatch = item.aiAnalysis.match(/### 3\. Diagnostic Assessment[\s\S]*?- (.*?)(?:\n|-|\.|$)/i);
            if (diagnosisMatch && diagnosisMatch[1]) {
                let diagnosisText = diagnosisMatch[1].replace(/^\*\*Most Likely Diagnosis\*\*:\s*/i, '').trim();
                diagnosisText = diagnosisText.split('\n')[0].trim(); // Take only the first line if multi-line
                mostLikelyDiagnosis.textContent = diagnosisText;
                mostLikelySection.style.display = 'flex'; // Show the diagnosis section
            } else {
                mostLikelySection.style.display = 'none'; // Hide if not found
                mostLikelyDiagnosis.textContent = '';
            }

            // Extract and display Visual Findings
            const visualFindingsMatch = item.aiAnalysis.match(/### 6\. Visual Annotation Points & Clinical Importance \(Textual Description\)([\s\S]*?)(?:###|$)/i);
            if (visualFindingsMatch && visualFindingsMatch[1]) {
                const findingsText = visualFindingsMatch[1].trim();
                if (findingsText.toLowerCase().includes('no specific discrete points for visual annotation')) {
                    visualFindingsOutput.innerHTML = '<p class="placeholder">No specific discrete points for visual annotation.</p>';
                } else {
                    // Basic markdown to HTML conversion for visual findings list
                    let formattedFindings = findingsText
                        .replace(/^- \*\*Location (.*?):\*\*/gm, '<h4>Location $1:</h4>')
                        .replace(/^- \*\*Clinical Importance:\*\*/gm, '<p><strong>Clinical Importance:</strong></p>')
                        .replace(/^\s*\-\s*/gm, '') // Remove list hyphens if not a real list
                        .replace(/(\r\n|\r|\n){2,}/g, '$1\n'); // Reduce multiple newlines
                    visualFindingsOutput.innerHTML = formattedFindings;
                }
            } else {
                visualFindingsOutput.innerHTML = '<p class="placeholder">Visual findings related to specific locations will appear here.</p>';
            }

            resultsSection.style.display = 'block'; // Ensure results section is visible
        }
    }

    // Function to clear the results display area
    function clearResults() {
        aiAnalysisOutput.innerHTML = '<p class="placeholder">Your AI analysis will appear here after submission.</p>';
        imagePreview.style.display = 'none';
        imagePreview.src = ''; // Clear image source
        noImageText.style.display = 'block';
        mostLikelySection.style.display = 'none';
        mostLikelyDiagnosis.textContent = '';
        visualFindingsOutput.innerHTML = '<p class="placeholder">Visual findings related to specific locations will appear here.</p>';
        resultsSection.style.display = 'none'; // Hide results section
        document.querySelectorAll('.past-analyses-list li').forEach(li => li.classList.remove('active')); // Clear active state in history
    }

    // --- Event Listeners ---

    // Sidebar toggle functionality
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        // Re-render history on collapse/expand to adjust text visibility if needed
        // Delay to allow CSS transition to complete before re-rendering
        setTimeout(renderHistory, 300);
    });

    // Image file input change listener for preview
    medicalImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                noImageText.style.display = 'none';
            };
            reader.readAsDataURL(file); // Read file as Data URL for immediate preview
        } else {
            // Clear preview if no file selected
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            noImageText.style.display = 'block';
        }
    });

    // Form submission handler
    analysisForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default browser form submission

        const imageFile = medicalImageInput.files[0];
        const patientHistory = document.getElementById('patientHistory').value;
        const referralNotes = document.getElementById('referralNotes').value;

        // Client-side validation
        if (!imageFile) {
            alert("Please select a medical image to analyze.");
            return;
        }

        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/tiff'];
        if (!allowedTypes.includes(imageFile.type)) {
            alert("Invalid file type. Please select a PNG, JPG, JPEG, GIF, BMP, or TIFF image.");
            medicalImageInput.value = ''; // Clear the input
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (imageFile.size > maxSize) {
            alert("File size exceeds 10MB. Please select a smaller image.");
            medicalImageInput.value = ''; // Clear the input
            return;
        }

        // Show loading spinner and clear previous results
        loadingSpinner.style.display = 'flex';
        clearResults(); // Clear everything when a new analysis starts

        // Prepare form data for AJAX request
        const formData = new FormData();
        formData.append('medicalImage', imageFile);
        formData.append('patientHistory', patientHistory);
        formData.append('referralNotes', referralNotes);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData // Send FormData directly
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Populate AI analysis output
            aiAnalysisOutput.innerHTML = data.aiAnalysis;
            aiAnalysisOutput.classList.remove('placeholder');

            // Set the image preview again (this time from the server response, which is base64 encoded)
            imagePreview.src = `data:image/jpeg;base64,${data.imagePreview}`;
            imagePreview.style.display = 'block';
            noImageText.style.display = 'none';

            // Extract and display Most Likely Diagnosis (duplicate logic from loadAnalysis for consistency)
            const diagnosisMatch = data.aiAnalysis.match(/### 3\. Diagnostic Assessment[\s\S]*?- (.*?)(?:\n|-|\.|$)/i);
            if (diagnosisMatch && diagnosisMatch[1]) {
                let diagnosisText = diagnosisMatch[1].replace(/^\*\*Most Likely Diagnosis\*\*:\s*/i, '').trim();
                diagnosisText = diagnosisText.split('\n')[0].trim();
                mostLikelyDiagnosis.textContent = diagnosisText;
                mostLikelySection.style.display = 'flex';
            } else {
                mostLikelySection.style.display = 'none';
                mostLikelyDiagnosis.textContent = '';
            }

            // Extract and display Visual Findings (duplicate logic from loadAnalysis for consistency)
            const visualFindingsMatch = data.aiAnalysis.match(/### 6\. Visual Annotation Points & Clinical Importance \(Textual Description\)([\s\S]*?)(?:###|$)/i);
            if (visualFindingsMatch && visualFindingsMatch[1]) {
                const findingsText = visualFindingsMatch[1].trim();
                if (findingsText.toLowerCase().includes('no specific discrete points for visual annotation')) {
                    visualFindingsOutput.innerHTML = '<p class="placeholder">No specific discrete points for visual annotation.</p>';
                } else {
                    let formattedFindings = findingsText
                        .replace(/^- \*\*Location (.*?):\*\*/gm, '<h4>Location $1:</h4>')
                        .replace(/^- \*\*Clinical Importance:\*\*/gm, '<p><strong>Clinical Importance:</strong></p>')
                        .replace(/^\s*\-\s*/gm, '')
                        .replace(/(\r\n|\r|\n){2,}/g, '$1\n');
                    visualFindingsOutput.innerHTML = formattedFindings;
                }
            } else {
                visualFindingsOutput.innerHTML = '<p class="placeholder">Visual findings related to specific locations will appear here.</p>';
            }

            resultsSection.style.display = 'block'; // Ensure results section is visible

            // Add the new analysis to the history and update localStorage
            const analysisSummary = imageFile.name.length > 30 ? imageFile.name.substring(0, 27) + '...' : imageFile.name;
            analysisHistory.unshift({ // Add to the beginning of the array
                summary: analysisSummary,
                timestamp: new Date().toISOString(),
                aiAnalysis: data.aiAnalysis,
                imagePreview: data.imagePreview,
                patientHistory: data.patientHistory, // Store patient history
                referralNotes: data.referralNotes   // Store referral notes
            });
            localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
            renderHistory(); // Re-render the sidebar history

            // Clear the form after successful submission
            analysisForm.reset();
            medicalImageInput.value = ''; // Explicitly clear file input
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            noImageText.style.display = 'block';

        } catch (error) {
            console.error('Error during analysis:', error);
            alert(`Analysis failed: ${error.message}`);
            aiAnalysisOutput.innerHTML = '<p class="placeholder error-message">Analysis failed. Please try again. Error: ' + error.message + '</p>';
        } finally {
            loadingSpinner.style.display = 'none'; // Hide spinner regardless of success/failure
        }
    });

    // Initial render of history when the page loads
    renderHistory();
});