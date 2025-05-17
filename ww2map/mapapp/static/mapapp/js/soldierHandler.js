// js/soldierHandler.js

/**
 * Shows detailed information about a soldier in a modal
 * @param {Object} soldier - The soldier object containing soldier data
 */
export async function showSoldierDetails(soldier) {
    console.log("🔵 לוחם שנבחר:", soldier);
    
    // Get the soldier ID to fetch full details
    const soldierId = soldier.id;
    
    // Show modal and loading state
    const modal = document.getElementById("soldierModal");
    if (!modal) {
        console.error("❌ שגיאה: מודאל הלוחם לא נמצא!");
        return;
    }
    
    // מנע גלילה של העמוד מאחורי המודל
    document.body.style.overflow = 'hidden';
    
    showLoadingState();
    
    try {
        // Fetch soldier details from API
        const response = await fetch(`/soldier/${soldierId}/`);
        
        if (!response.ok) {
            throw new Error(`שגיאה בקבלת מידע על הלוחם: ${response.status}`);
        }
        
        const soldierDetails = await response.json();
        
        // Populate the modal with soldier details
        populateSoldierModal(soldierDetails);
        
        // Display the modal
        modal.style.display = "block";
        
        // Setup close button
        setupSoldierModalClose();
        
    } catch (error) {
        console.error("❌ שגיאה בטעינת פרטי הלוחם:", error);
        
        // If fetch fails, still show the modal with basic info
        populateSoldierModal(soldier, true);
        modal.style.display = "block";
        setupSoldierModalClose();
    }
}

/**
 * Shows loading state in the soldier modal
 */
function showLoadingState() {
    // Set basic elements to loading state
    document.getElementById("soldierName").textContent = "טוען...";
    document.getElementById("soldierImage").src = "";
    document.getElementById("soldierLargeImage").src = "";
    
    // Add loading spinners to content areas
    const sections = [
        "soldierDetails",
        "soldierFightingDesc"
    ];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.innerHTML = `
                <div class="loading-spinner-container">
                    <div class="loading-spinner"></div>
                    <p>טוען מידע...</p>
                </div>
            `;
        }
    });
}

/**
 * Populates the soldier modal with data
 * @param {Object} soldier - The soldier data object
 * @param {boolean} isBasicInfo - Whether we're using basic info or complete details
 */
function populateSoldierModal(soldier, isBasicInfo = false) {
    // Basic info elements
    document.getElementById("soldierName").textContent = soldier.name || `לוחם ${soldier.id}`;
    
    // Set images
    const imageUrl = soldier.image_url || soldier.image || getDefaultImageByGender(soldier.gender);
    document.getElementById("soldierImage").src = imageUrl;
    document.getElementById("soldierLargeImage").src = imageUrl;
    
    // Set badge with gender or rank info
    const badge = document.getElementById("soldierBadge");
    if (badge) {
        const gender = getGenderText(soldier.gender);
        const rank = isBasicInfo ? "" : soldier.rank;
        badge.textContent = rank || gender || "לוחם/ת";
    }
    
    if (isBasicInfo) {
        // We only have basic info, so display that with a message
        setBasicSoldierInfo(soldier);
        return;
    }
    
    // Full soldier details
    
    // Personal details
    setElementText("soldierNameEn", getFullNameEn(soldier));
    setElementText("soldierGender", getGenderText(soldier.gender));
    setElementText("soldierBirthDate", formatDate(soldier.date_of_birth));
    setElementText("soldierBirthCity", soldier.birth_city_he);
    setElementText("soldierBirthCountry", soldier.birth_country?.name_he);
    setElementText("soldierAliyaDate", formatDate(soldier.aliya_date));
    
    // Military service
    setElementText("soldierArmy", soldier.army_he);
    setElementText("soldierRole", soldier.army_role_he);
    setElementText("soldierRank", soldier.rank);
    
    // Check if each section has any visible children after setting text
    // For text blocks, check if content exists
    const setTextBlock = (elementId, text) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const parentSection = element.closest('.details-section');
        
        if (!text || text === "nan" || text === "NaN" || text === "undefined" || text === "null") {
            element.style.display = 'none';
            // If this is the only element in the section, hide the section
            if (parentSection) {
                parentSection.style.display = 'none';
            }
        } else {
            element.textContent = text;
            element.style.display = '';
            if (parentSection) {
                parentSection.style.display = '';
            }
        }
    };
    
    // Longer text fields
    setTextBlock("soldierParticipation", soldier.participation_he);
    setTextBlock("soldierDecorations", soldier.decorations_he);
    setTextBlock("soldierBiography", soldier.biography_he);
    setTextBlock("soldierFightingDesc", soldier.fighting_description_he);
    
    // Check sections with multiple info-rows to see if all are hidden
    const checkSectionVisibility = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        const infoRows = section.querySelectorAll('.info-row');
        let allHidden = true;
        
        infoRows.forEach(row => {
            if (row.style.display !== 'none') {
                allHidden = false;
            }
        });
        
        // If all info-rows are hidden, hide the section
        const parentSection = section.closest('.details-section');
        if (parentSection) {
            parentSection.style.display = allHidden ? 'none' : '';
        }
    };
    
    // Check visibility of sections with multiple fields
    setTimeout(() => {
        // Use setTimeout to ensure DOM updates have completed
        checkSectionVisibility(document.querySelector('.details-grid'));
    }, 0);
    
    // Display video if available
    const videoElement = document.getElementById("soldierVideo");
    if (videoElement && soldier.video_url) {
        videoElement.src = soldier.video_url;
        videoElement.style.display = "block";
        document.getElementById("soldierLargeImage").style.display = "none";
    } else if (videoElement) {
        videoElement.style.display = "none";
        document.getElementById("soldierLargeImage").style.display = "block";
    }
}

/**
 * Sets basic soldier info when full details aren't available
 * @param {Object} soldier - Basic soldier data
 */
function setBasicSoldierInfo(soldier) {
    // Hide all detail fields by default
    const detailFields = document.querySelectorAll('.info-row');
    detailFields.forEach(field => {
        field.style.display = 'none';
    });
    
    // Hide all text blocks
    const textBlocks = [
        "soldierParticipation", "soldierDecorations", "soldierBiography",
        "soldierFightingDesc"
    ];
    
    textBlocks.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
            // Hide parent section
            const parentSection = element.closest('.details-section');
            if (parentSection) {
                parentSection.style.display = 'none';
            }
        }
    });
    
    // Set gender if available
    if (soldier.gender) {
        const genderElement = document.getElementById("soldierGender");
        const genderRow = genderElement?.closest('.info-row');
        if (genderElement && genderRow) {
            genderElement.textContent = getGenderText(soldier.gender);
            genderRow.style.display = '';
        }
    }
    
    // Set country if available
    if (soldier.country) {
        const countryElement = document.getElementById("soldierBirthCountry");
        const countryRow = countryElement?.closest('.info-row');
        if (countryElement && countryRow) {
            countryElement.textContent = soldier.country;
            countryRow.style.display = '';
        }
    }
    
    // Hide sections that don't have any visible content
    const detailsSections = document.querySelectorAll('.details-section');
    detailsSections.forEach(section => {
        let hasVisibleContent = false;
        
        // Check for visible info-rows
        const infoRows = section.querySelectorAll('.info-row');
        infoRows.forEach(row => {
            if (row.style.display !== 'none') {
                hasVisibleContent = true;
            }
        });
        
        // Check for visible text blocks
        const textBlocks = section.querySelectorAll('.text-block');
        textBlocks.forEach(block => {
            if (block.style.display !== 'none') {
                hasVisibleContent = true;
            }
        });
        
        // Hide section if it has no visible content
        section.style.display = hasVisibleContent ? '' : 'none';
    });
    
    // Hide video
    const videoElement = document.getElementById("soldierVideo");
    if (videoElement) {
        videoElement.style.display = "none";
        document.getElementById("soldierLargeImage").style.display = "block";
    }
}

/**
 * Helper function to set text content of an element
 * @param {string} elementId - The ID of the element
 * @param {string} text - The text to set
 */
function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Check for empty, null, undefined, or "nan" values
    if (!text || text === "--" || text === "nan" || text === "NaN" || text === "undefined" || text === "null") {
        // Find the parent info-row and hide it
        const parentRow = element.closest('.info-row');
        if (parentRow) {
            parentRow.style.display = 'none';
        } else {
            // If not in an info-row, just hide the element
            element.style.display = 'none';
        }
    } else {
        // Show the element and its parent row if they exist
        element.textContent = text;
        element.style.display = '';
        
        const parentRow = element.closest('.info-row');
        if (parentRow) {
            parentRow.style.display = '';
        }
    }
}

/**
 * Get gender text representation
 * @param {string|number} gender - Gender code
 * @returns {string} - Gender text in Hebrew
 */
function getGenderText(gender) {
    if (gender === "1" || gender === "1.0" || gender === 1) {
        return "זכר";
    } else if (gender === "0" || gender === "0.0" || gender === 0) {
        return "נקבה";
    }
    return "--";
}

/**
 * Get default profile image based on gender
 * @param {string|number} gender - Gender code
 * @returns {string} - URL to default image
 */
function getDefaultImageByGender(gender) {
    if (gender === "1" || gender === "1.0" || gender === 1) {
        return "https://media.istockphoto.com/id/666545204/vector/default-placeholder-profile-icon.jpg?s=612x612&w=0&k=20&c=UGYk-MX0pFWUZOr5hloXDREB6vfCqsyS7SgbQ1-heY8=";
    }
    return "https://media.istockphoto.com/id/666545148/vector/default-placeholder-profile-icon.jpg?s=612x612&w=0&k=20&c=swBnLcHy6L9v5eaiRkDwfGLr5cfLkH9hKW-sZfH-m90=";
}

/**
 * Combine English first and last name
 * @param {Object} soldier - Soldier data
 * @returns {string} - Full English name
 */
function getFullNameEn(soldier) {
    const firstName = soldier.first_name_en || "";
    const lastName = soldier.last_name_en || "";
    if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
    }
    return "--";
}

/**
 * Format date strings for display
 * @param {string} dateStr - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateStr) {
    if (!dateStr) return "--";
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('he-IL');
    } catch (e) {
        return dateStr;
    }
}

/**
 * Sets up the close button for the soldier modal
 */
function setupSoldierModalClose() {
    const modal = document.getElementById("soldierModal");
    const closeButton = document.getElementById("soldierClose");
    
    if (closeButton) {
        // Remove existing event listeners (to prevent duplicates)
        const newCloseButton = closeButton.cloneNode(true);
        closeButton.parentNode.replaceChild(newCloseButton, closeButton);
        
        // Add new event listener
        newCloseButton.addEventListener("click", closeSoldierModal);
    }
    
    // Close when clicking outside the modal
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeSoldierModal();
        }
    });
}

/**
 * Closes the soldier modal
 */
export function closeSoldierModal() {
    const modal = document.getElementById("soldierModal");
    if (modal) {
        modal.style.display = "none";
        
        // החזר גלילה לעמוד הראשי
        document.body.style.overflow = '';
    }
}

// Make closeSoldierModal available globally for the inline onclick handler
window.closeSoldierModal = closeSoldierModal;
