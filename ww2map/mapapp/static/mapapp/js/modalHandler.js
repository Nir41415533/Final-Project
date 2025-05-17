    // js/modalHandler.js

    import { displayEvent, showCountryEvents } from "./eventDisplay.js";
    import { showSoldierDetails } from "./soldierHandler.js";

    // Keep a reference to all soldiers for search functionality
    let allSoldiers = [];
    let currentCountry = ""; // Keep track of the current country
    let currentPage = 1;     // Current page of results
    let totalPages = 1;      // Total pages available
    let isLoading = false;   // Flag to prevent multiple simultaneous loads
    let searchQuery = "";    // Current search query

    export function showCountryEventsModal(countryName, events, soldiers) {
        const modal = document.getElementById("eventModal");
        if (!modal) {
            console.error("❌ שגיאה: המודאל לא נמצא!");
            return;
        }

        console.log("Opening modal for country:", countryName);

        // Initialize modal elements
        const eventTitle = document.getElementById("eventTitle");
        const eventSummary = document.getElementById("eventSummary");
        const imageElement = document.getElementById("eventImage");
        const videoElement = document.getElementById("eventVideo");
        const soldiersContainer = document.getElementById("soldiersContainer");
        const soldiersTitle = document.getElementById("soldiersTitle");
        const eventDetails = document.getElementById("eventDetails");
        const soldiersSearch = document.getElementById("soldiersSearch");
        const clearSearch = document.getElementById("clearSearch");
        const eventsContainer = document.getElementById("eventsContainer");
        const advancedFilterButton = document.getElementById("advancedFilterButton");
        const advancedFilters = document.getElementById("advancedFilters");

        // Reset modal content
        if (eventTitle) eventTitle.textContent = countryName;
        if (eventSummary) eventSummary.innerHTML = "אין תיאור זמין";
        if (imageElement) {
            imageElement.src = "";
            imageElement.style.display = "none";
        }
        if (videoElement) {
            videoElement.src = "";
            videoElement.style.display = "none";
        }
        
        // Note: We don't change the flag here because it is set by the caller
        // This ensures the flag stays visible when viewing different events
        
        // Reset pagination and search
        currentCountry = getEnglishCountryName(countryName);
        currentPage = 1;
        searchQuery = "";
        
        // Store initial soldiers from the direct call (we'll keep this for backward compatibility)
        allSoldiers = [...soldiers];

        // Handle soldiers section
        if (soldiersContainer) {
            // Clear container
            soldiersContainer.innerHTML = "";
            
            // Start loading first page
            loadSoldiers(currentCountry, currentPage);
        }

        if (soldiersTitle) {
            // Display loading message instead of hiding
            soldiersTitle.textContent = "טוען לוחמים...";
            soldiersTitle.style.display = "block";
        }

        // Setup search functionality
        if (soldiersSearch) {
            soldiersSearch.value = ""; // Clear any previous search
            
            // Remove any existing event listeners to prevent duplicates
            const newSearchElement = soldiersSearch.cloneNode(true);
            soldiersSearch.parentNode.replaceChild(newSearchElement, soldiersSearch);
            
            // Add event listeners to new element
            newSearchElement.addEventListener("input", function() {
                searchQuery = this.value.trim();
                
                // Show clear button when there's text
                if (clearSearch) {
                    clearSearch.style.display = searchQuery ? "block" : "none";
                }
                
                // Reset pagination and search
                currentPage = 1;
                
                // Debounce the search - only perform search after 300ms of no typing
                if (this.searchTimeout) {
                    clearTimeout(this.searchTimeout);
                }
                
                this.searchTimeout = setTimeout(() => {
                    loadSoldiers(currentCountry, currentPage);
                }, 300);
            });
        }

        // Setup advanced filter toggle
        if (advancedFilterButton) {
            // Remove any existing event listeners to prevent duplicates
            const newFilterButton = advancedFilterButton.cloneNode(true);
            advancedFilterButton.parentNode.replaceChild(newFilterButton, advancedFilterButton);
            
            // Add event listener to new element
            newFilterButton.addEventListener("click", function() {
                if (advancedFilters) {
                    // Toggle visibility
                    if (advancedFilters.style.display === "none" || !advancedFilters.style.display) {
                        advancedFilters.style.display = "block";
                        this.classList.add("active");
                    } else {
                        advancedFilters.style.display = "none";
                        this.classList.remove("active");
                    }
                }
            });
        }

        // Setup filter form
        setupFilterForm();

        if (clearSearch) {
            clearSearch.style.display = "none"; // Initially hidden
            
            // Remove any existing event listeners to prevent duplicates
            const newClearElement = clearSearch.cloneNode(true);
            clearSearch.parentNode.replaceChild(newClearElement, clearSearch);
            
            // Add event listeners to new element
            newClearElement.addEventListener("click", function() {
                if (soldiersSearch) {
                    soldiersSearch.value = "";
                    searchQuery = "";
                    currentPage = 1;
                    loadSoldiers(currentCountry, currentPage);
                    this.style.display = "none";
                    soldiersSearch.focus();
                }
            });
        }

        // Show modal
        modal.style.display = "block";
        
        // Display events if available
        if (events && events.length > 0) {
            window.currentEvents = events;
            window.currentIndex = 0;
            
            // Call showCountryEvents
            showCountryEvents(countryName, events);
            
            // Don't show event details initially - wait for user to click a card
            if (eventDetails) {
                eventDetails.style.display = 'none';
            }
        } else {
            console.log("No events found for this country");
            if (eventsContainer) {
                eventsContainer.innerHTML = '<div class="no-events">לא נמצאו אירועים למדינה זו</div>';
            }
            if (eventDetails) {
                eventDetails.style.display = 'none';
            }
        }
        
        // Setup intersection observer for infinite scroll
        setupInfiniteScroll();
    }

    // Helper function to get English country name from Hebrew (for API calls)
    function getEnglishCountryName(hebrewName) {
        // Try to find country name in the global mapping
        if (window.countries) {
            return window.countries[hebrewName] || hebrewName.toLowerCase();
        }
        
        // Fallback - return the name as is, but lowercase
        return hebrewName.toLowerCase();
    }

    // Function to load soldiers from the API
    async function loadSoldiers(country, page, append = false) {
        if (isLoading) return;
        isLoading = true;
        
        const soldiersContainer = document.getElementById("soldiersContainer");
        const soldiersTitle = document.getElementById("soldiersTitle");
        
        if (!append) {
            // Show loading spinner if we're replacing content
            soldiersContainer.innerHTML = `
                <div class="loading-spinner-container">
                    <div class="loading-spinner"></div>
                    <p>טוען לוחמים...</p>
                </div>
            `;
        } else {
            // Add loading spinner at the bottom if we're appending
            const loadingIndicator = document.createElement("div");
            loadingIndicator.classList.add("loading-indicator");
            loadingIndicator.innerHTML = `
                <div class="loading-spinner"></div>
                <p>טוען עוד לוחמים...</p>
            `;
            soldiersContainer.appendChild(loadingIndicator);
        }
        
        try {
            // Call the paginated API
            const params = new URLSearchParams({
                country: country,
                page: page,
                limit: 50, // Load 50 soldiers at a time
                search: searchQuery
            });
            
            const response = await fetch(`/soldiers/paginated/?${params}`);
            const data = await response.json();
            
            // Update pagination info
            totalPages = data.pagination.pages;
            
            // Update soldiers heading
            if (soldiersTitle) {
                if (data.pagination.total > 0) {
                    soldiersTitle.textContent = `לוחמים ממדינה זו (${data.pagination.total})`;
                    soldiersTitle.style.display = "block";
                } else {
                    soldiersTitle.textContent = "לא נמצאו לוחמים למדינה זו";
                    soldiersTitle.style.display = "block";
                }
            }
            
            // Render the soldiers
            if (append) {
                // Remove the loading indicator if it exists
                const loadingIndicator = soldiersContainer.querySelector(".loading-indicator");
                if (loadingIndicator) {
                    soldiersContainer.removeChild(loadingIndicator);
                }
                
                // Append new soldiers
                renderSoldiers(data.soldiers, soldiersContainer, true);
            } else {
                // Replace all soldiers
                renderSoldiers(data.soldiers, soldiersContainer, false);
            }
            
            // Add pagination info if needed
            if (data.pagination.total > 0) {
                updatePaginationInfo(soldiersContainer, data.pagination);
            }
            
            // Update our local cache of all soldiers
            if (append) {
                // Append to existing soldiers
                allSoldiers = [...allSoldiers, ...data.soldiers];
            } else {
                // Replace all soldiers
                allSoldiers = [...data.soldiers];
            }
        } catch (error) {
            console.error("❌ שגיאה בטעינת לוחמים:", error);
            soldiersContainer.innerHTML = `<p class="error-message">שגיאה בטעינת לוחמים: ${error.message}</p>`;
        } finally {
            isLoading = false;
        }
    }

    // Function to render soldiers list
    function renderSoldiers(soldiers, container, append = false) {
        if (!container) return;
        
        if (!append) {
            container.innerHTML = "";
        }
        
        if (soldiers.length === 0 && !append) {
            container.innerHTML = "<p>לא נמצאו לוחמים למדינה זו</p>";
            return;
        }

        soldiers.forEach(soldier => {
            const soldierDiv = document.createElement("div");
            soldierDiv.classList.add("soldier");

            const imageUrl = soldier.image && soldier.image.trim() !== ""
                ? soldier.image
                : (soldier.gender === "1.0" || soldier.gender === "1" || soldier.gender === 1
                    ? "https://media.istockphoto.com/id/666545204/vector/default-placeholder-profile-icon.jpg?s=612x612&w=0&k=20&c=UGYk-MX0pFWUZOr5hloXDREB6vfCqsyS7SgbQ1-heY8="
                    : "https://media.istockphoto.com/id/666545148/vector/default-placeholder-profile-icon.jpg?s=612x612&w=0&k=20&c=swBnLcHy6L9v5eaiRkDwfGLr5cfLkH9hKW-sZfH-m90=");

            soldierDiv.innerHTML = `
                <div class="soldier-image">
                    <img src="${imageUrl}" alt="${soldier.name || 'לוחם'}">
                </div>
                <p class="soldier-name">${soldier.name || 'לוחם'}</p>
            `;

            soldierDiv.onclick = () => showSoldierDetails(soldier);
            container.appendChild(soldierDiv);
        });
        
        // Add a sentinel element for infinite scroll
        const sentinel = document.createElement("div");
        sentinel.classList.add("scroll-sentinel");
        container.appendChild(sentinel);
    }

    // Function to update pagination info and buttons
    function updatePaginationInfo(container, pagination) {
        // Only show pagination if there are multiple pages
        if (pagination.pages <= 1) {
            return;
        }

        const paginationInfo = document.createElement("div");
        paginationInfo.classList.add("pagination-info");
        
        // Create pagination controls
        const controls = document.createElement("div");
        controls.classList.add("pagination-controls");
        
        // Previous button
        const prevButton = document.createElement("button");
        prevButton.classList.add("pagination-button");
        prevButton.textContent = "הקודם";
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadSoldiers(currentCountry, currentPage);
            }
        };
        
        // Next button
        const nextButton = document.createElement("button");
        nextButton.classList.add("pagination-button");
        nextButton.textContent = "הבא";
        nextButton.disabled = currentPage >= pagination.pages;
        nextButton.onclick = () => {
            if (currentPage < pagination.pages) {
                currentPage++;
                loadSoldiers(currentCountry, currentPage);
            }
        };
        
        // Page info
        const pageInfo = document.createElement("span");
        pageInfo.classList.add("page-info");
        pageInfo.textContent = `${currentPage} / ${pagination.pages}`;
        
        // Add elements to controls
        controls.appendChild(prevButton);
        controls.appendChild(pageInfo);
        controls.appendChild(nextButton);
        
        // Add controls to pagination info
        paginationInfo.appendChild(controls);
        
        // Add to container
        container.appendChild(paginationInfo);
    }

    // Function to set up infinite scroll
    function setupInfiniteScroll() {
        const soldiersContainer = document.getElementById("soldiersContainer");
        if (!soldiersContainer) return;
        
        // Create an IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoading && currentPage < totalPages) {
                    // Load the next page
                    currentPage++;
                    loadSoldiers(currentCountry, currentPage, true);
                }
            });
        }, { rootMargin: "0px 0px 200px 0px" }); // Start loading when 200px from the bottom
        
        // Observe the sentinel element
        const sentinel = soldiersContainer.querySelector(".scroll-sentinel");
        if (sentinel) {
            observer.observe(sentinel);
        }
    }

    // Function to setup the filter form
    function setupFilterForm() {
        const filterForm = document.getElementById("filterForm");
        if (!filterForm) return;
        
        // Get filter elements
        const genderFilter = document.getElementById("genderFilter");
        const rankFilter = document.getElementById("rankFilter");
        const yearFromFilter = document.getElementById("yearFromFilter");
        const yearToFilter = document.getElementById("yearToFilter");
        const sortByFilter = document.getElementById("sortByFilter");
        const applyFiltersBtn = document.getElementById("applyFilters");
        const resetFiltersBtn = document.getElementById("resetFilters");
        
        // Clear any existing values
        if (genderFilter) genderFilter.value = "";
        if (rankFilter) rankFilter.value = "";
        if (yearFromFilter) yearFromFilter.value = "";
        if (yearToFilter) yearToFilter.value = "";
        if (sortByFilter) sortByFilter.value = "name";
        
        // Initialize filter state
        let filters = {
            gender: "",
            rank: "",
            yearFrom: "",
            yearTo: "",
            sortBy: "name"
        };
        
        // Remove any existing event listeners to prevent duplicates
        if (applyFiltersBtn) {
            const newApplyBtn = applyFiltersBtn.cloneNode(true);
            applyFiltersBtn.parentNode.replaceChild(newApplyBtn, applyFiltersBtn);
            
            // Add event listener to new element
            newApplyBtn.addEventListener("click", function(e) {
                e.preventDefault();
                
                // Update filter state
                filters.gender = genderFilter ? genderFilter.value : "";
                filters.rank = rankFilter ? rankFilter.value : "";
                filters.yearFrom = yearFromFilter ? yearFromFilter.value : "";
                filters.yearTo = yearToFilter ? yearToFilter.value : "";
                filters.sortBy = sortByFilter ? sortByFilter.value : "name";
                
                // Reset pagination
                currentPage = 1;
                
                // Apply filters
                loadSoldiersWithFilters(currentCountry, currentPage, filters);
                
                // Optionally hide filter panel after applying
                const advancedFilters = document.getElementById("advancedFilters");
                const advancedFilterButton = document.getElementById("advancedFilterButton");
                if (advancedFilters) {
                    advancedFilters.style.display = "none";
                }
                if (advancedFilterButton) {
                    advancedFilterButton.classList.remove("active");
                }
            });
        }
        
        // Reset filters button
        if (resetFiltersBtn) {
            const newResetBtn = resetFiltersBtn.cloneNode(true);
            resetFiltersBtn.parentNode.replaceChild(newResetBtn, resetFiltersBtn);
            
            // Add event listener to new element
            newResetBtn.addEventListener("click", function(e) {
                e.preventDefault();
                
                // Reset filter UI
                if (genderFilter) genderFilter.value = "";
                if (rankFilter) rankFilter.value = "";
                if (yearFromFilter) yearFromFilter.value = "";
                if (yearToFilter) yearToFilter.value = "";
                if (sortByFilter) sortByFilter.value = "name";
                
                // Reset filter state
                filters = {
                    gender: "",
                    rank: "",
                    yearFrom: "",
                    yearTo: "",
                    sortBy: "name"
                };
                
                // Reset pagination
                currentPage = 1;
                
                // Load soldiers without filters
                loadSoldiers(currentCountry, currentPage);
            });
        }
    }

    // Function to load soldiers with additional filters
    async function loadSoldiersWithFilters(country, page, filters, append = false) {
        if (isLoading) return;
        isLoading = true;
        
        const soldiersContainer = document.getElementById("soldiersContainer");
        const soldiersTitle = document.getElementById("soldiersTitle");
        
        if (!append) {
            // Show loading spinner if we're replacing content
            soldiersContainer.innerHTML = `
                <div class="loading-spinner-container">
                    <div class="loading-spinner"></div>
                    <p>טוען לוחמים...</p>
                </div>
            `;
        } else {
            // Add loading spinner at the bottom if we're appending
            const loadingIndicator = document.createElement("div");
            loadingIndicator.classList.add("loading-indicator");
            loadingIndicator.innerHTML = `
                <div class="loading-spinner"></div>
                <p>טוען עוד לוחמים...</p>
            `;
            soldiersContainer.appendChild(loadingIndicator);
        }
        
        try {
            // Build URL parameters
            const params = new URLSearchParams({
                country: country,
                page: page,
                limit: 50,
                search: searchQuery
            });
            
            // Add filter parameters if they exist
            if (filters.gender) params.append("gender", filters.gender);
            if (filters.rank) params.append("rank", filters.rank);
            if (filters.yearFrom) params.append("year_from", filters.yearFrom);
            if (filters.yearTo) params.append("year_to", filters.yearTo);
            if (filters.sortBy) params.append("sort_by", filters.sortBy);
            
            const response = await fetch(`/soldiers/paginated/?${params}`);
            const data = await response.json();
            
            // Update pagination info
            totalPages = data.pagination.pages;
            
            // Update soldiers heading
            if (soldiersTitle) {
                if (data.pagination.total > 0) {
                    soldiersTitle.textContent = `לוחמים ממדינה זו (${data.pagination.total})`;
                    soldiersTitle.style.display = "block";
                } else {
                    soldiersTitle.textContent = "לא נמצאו לוחמים למדינה זו";
                    soldiersTitle.style.display = "block";
                }
            }
            
            // Render the soldiers
            if (append) {
                // Remove the loading indicator if it exists
                const loadingIndicator = soldiersContainer.querySelector(".loading-indicator");
                if (loadingIndicator) {
                    soldiersContainer.removeChild(loadingIndicator);
                }
                
                // Append new soldiers
                renderSoldiers(data.soldiers, soldiersContainer, true);
            } else {
                // Replace all soldiers
                renderSoldiers(data.soldiers, soldiersContainer, false);
            }
            
            // Add pagination info if needed
            if (data.pagination.total > 0) {
                updatePaginationInfo(soldiersContainer, data.pagination);
            }
            
            // Update our local cache of all soldiers
            if (append) {
                // Append to existing soldiers
                allSoldiers = [...allSoldiers, ...data.soldiers];
            } else {
                // Replace all soldiers
                allSoldiers = [...data.soldiers];
            }
        } catch (error) {
            console.error("❌ שגיאה בטעינת לוחמים:", error);
            soldiersContainer.innerHTML = `<p class="error-message">שגיאה בטעינת לוחמים: ${error.message}</p>`;
        } finally {
            isLoading = false;
        }
    }

    export function setupModalClose(map) {
        const modal = document.getElementById("eventModal");
        const closeButton = document.getElementById("eventClose");

        if (closeButton) {
            closeButton.addEventListener("click", () => {
                modal.style.display = "none";
            });
        }

        // Close the modal when clicking outside of it
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    }
