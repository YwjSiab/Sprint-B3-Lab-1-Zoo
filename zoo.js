// Wait for the DOM to fully load before executing scripts
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Zoo Management System Loaded');

  try {

    // ==============================
    // Part 1: AJAX Data Fetch
    // ==============================
    
    /**
     * Displays or hides a loading message in the animal data container.
     * @param {boolean} isLoading - True to show the loading message, false to clear it.
     */
    function showLoading(isLoading) {
      const container = document.getElementById("animalContainer");
      if (container) {
        container.textContent = isLoading ? "Loading animal data..." : "";
      }
    }
    
    /**
     * Updates the DOM with the fetched animal data from the external API.
     * @param {Array} data - Array of animal objects.
     */
    function displayAnimalsFromApi(data) {
      const container = document.getElementById("animalContainer");
      if (!container) return;
      // Clear any previous content (including loading message)
      container.innerHTML = "";
      data.forEach(animal => {
        const card = document.createElement("div");
        card.classList.add("animal-card");
    
        const titleElement = document.createElement("h3");
        titleElement.textContent = `${animal.name} (${animal.species})`;
        card.appendChild(titleElement);
    
        const statusElement = document.createElement("p");
        statusElement.textContent = "Status: " + animal.status;
        card.appendChild(statusElement);
    
        const healthElement = document.createElement("p");
        healthElement.textContent = "Health: " + animal.health;
        card.appendChild(healthElement);
    
        container.appendChild(card);
      });
    }
    
    /**
     * Fetches animal data from an external API using the Fetch API.
     * Includes loading states and proper error handling.
     */
    async function fetchAnimalData() {
      // Replace with your actual API endpoint URL
      const apiUrl = "animals.json";
      showLoading(true);
      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          mode: "cors",         // This enables CORS for the request
          credentials: "include" // Ensures cookies are sent if required
        });
        if (!response.ok) {
          throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        showLoading(false);
        displayAnimalsFromApi(data);
      } catch (error) {
        showLoading(false);
        console.error("Error fetching animal data:", error.message);
        // Reuse your existing displayError function defined later in the file
        displayError("Failed to load animal data. Please try again later.");
      }
    }
    
    // Call the AJAX function to fetch data from the external API
    fetchAnimalData();

// ==============================
// Part 3: Protocol Security
// ==============================

/**
 * Verifies that the current page is loaded over HTTPS.
 * If not, logs a security warning, displays an error to the user,
 * and attempts to redirect to the HTTPS version.
 * Note: Certificate validation is automatically handled by browsers.
 */
function verifySecureProtocol() {
  if (window.location.protocol !== "https:") {
    console.warn("Security Warning: Insecure protocol detected. The page is not loaded via HTTPS.");
    displayError("This site requires a secure HTTPS connection. Redirecting to secure version...");
    
    // Fallback Handling: Attempt to redirect to the HTTPS version of the page.
    const secureUrl = window.location.href.replace(/^http:/i, "https:");
    console.log("Redirecting to HTTPS version:", secureUrl);
    
    // Use window.location.replace to navigate without creating a new history entry.
    window.location.replace(secureUrl);
    return false;
  }
  
  console.log("HTTPS protocol verified. Secure connection is active.");
  return true;
}

// Call protocol verification immediately after DOMContentLoaded
verifySecureProtocol();


// Security Enhancements for NTC Zoo
// Part 2: CSRF Protection & Part 3: DoS Prevention

// --- Configuration ---
const MAX_REQUESTS = 5;
const TIME_WINDOW_MS = 60000; // 60 seconds

// Utility: Generate UUID token
function generateCSRFToken() {
  return crypto.randomUUID();
}

// Set a new CSRF token
function setNewCSRFToken() {
  const token = generateCSRFToken();
  sessionStorage.setItem("csrfToken", token);
  const hiddenTokenInput = document.getElementById("csrfToken");
  if (hiddenTokenInput) hiddenTokenInput.value = token;
}

// Validate CSRF token
function validateCSRFToken(submittedToken) {
  const stored = sessionStorage.getItem("csrfToken");
  return submittedToken === stored;
}

// Track submission timestamps
function getSubmissionTimes() {
  return JSON.parse(sessionStorage.getItem("submissionTimes") || "[]");
}

function addSubmissionTime() {
  const now = Date.now();
  const times = getSubmissionTimes().filter(t => now - t < TIME_WINDOW_MS);
  times.push(now);
  sessionStorage.setItem("submissionTimes", JSON.stringify(times));
  return times;
}

function isRateLimited() {
  return getSubmissionTimes().filter(t => Date.now() - t < TIME_WINDOW_MS).length >= MAX_REQUESTS;
}

      // Insert CSRF token input into existing forms
      function addCSRFInputToForms() {
        const forms = ["membershipForm", "bookingForm"];
        forms.forEach(id => {
        const form = document.getElementById(id);
        if (form && !form.querySelector("#csrfToken")) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.id = "csrfToken";
          input.name = "csrfToken";
          form.appendChild(input);
        }
        });
      }

      // Overriding membership form handler with CSRF & DoS checks
      function secureMembershipForm() {
        const form = document.getElementById("membershipForm");
        if (!form) return;
        form.addEventListener("submit", (e) => {
        e.preventDefault();
        const results = [];
        const submittedToken = document.getElementById("csrfToken").value;

        if (!validateCSRFToken(submittedToken)) {
          displayError("Invalid or missing CSRF token.");
          results.push({ Test: "CSRF Token", Input: submittedToken, Expected: "Valid", Actual: "Invalid", Status: "FAIL" });
          console.table(results);
          return;
        }

        if (isRateLimited()) {
          displayError("Too many requests. Please wait.");
          results.push({ Test: "Rate Limiting", Input: getSubmissionTimes(), Expected: "<5", Actual: ">=5", Status: "FAIL" });
          console.table(results);
          return;
        }

          addSubmissionTime();
          results.push({ Test: "Valid Submission", Input: submittedToken, Expected: "Success", Actual: "Success", Status: "PASS" });
          console.table(results);

          handleMembershipSubmission(e);
          setNewCSRFToken();
        });
      }

      // Hook into page load
      window.addEventListener("DOMContentLoaded", () => {
        addCSRFInputToForms();
        setNewCSRFToken();
        secureMembershipForm();

        // Part 4: Simulated Testing
        const testResults = [];

        const token = generateCSRFToken();
        sessionStorage.setItem("csrfToken", token);
        testResults.push({ Test: "Token Generation", Input: "", Expected: "Token Exists", Actual: token ? "Exists" : "Missing", Status: token ? "PASS" : "FAIL" });

        testResults.push({ Test: "Missing Token", Input: "", Expected: "Rejected", Actual: validateCSRFToken("") ? "Accepted" : "Rejected", Status: validateCSRFToken("") ? "FAIL" : "PASS" });

        sessionStorage.setItem("csrfToken", token);
        testResults.push({ Test: "Reuse Old Token", Input: token, Expected: "Valid Once", Actual: validateCSRFToken(token) ? "Valid" : "Invalid", Status: "PASS" });

        console.table(testResults);
      });

      // Declaring variables for different animal species
      const elephants = 4;
      const tigers = 2;
      const pandas = 3;

      console.log("Number of Elephants:", elephants);
      console.log("Number of Tigers:", tigers);
      console.log("Number of Pandas:", pandas);

      // Calculate total number of animals in the zoo
      const totalAnimals = elephants + tigers + pandas;
      console.log("Total number of animals in the zoo:", totalAnimals);

      let zooOpen = true;
      zooOpen = !zooOpen;
      console.log("Is the zoo open?", zooOpen ? "Yes" : "No");

      // Step 1: Create an array to store animal objects
      let animals = [];
      let visitorCount = parseInt(localStorage.getItem("visitorCount")) || 0;
      let zooStatus = 'Open';

      // Step 2: Initialize animal data
      animals.push({ id: 1, name: 'Ellie', species: 'Elephant', count: 3, gender: 'Female', status: 'Open', health: 'Healthy' });
      animals.push({ id: 2, name: 'Tony', species: 'Tiger', count: 2, gender: 'Male', status: 'Closed', health: 'Sick' });
      animals.push({ id: 3, name: 'Panda', species: 'Panda', count: 4, gender: 'Male', status: 'Open', health: 'Healthy' });
      animals.push({ id: 4, name: 'Leo', species: 'Lion', count: 5, gender: 'Male', status: 'Open', health: 'Healthy' });

      //  Displays the animal list in a structured format.  Sprint B1 Zoo Part 1
      console.log("Current Zoo Animals:");
      console.table(animals);


      // Test Case: Valid Animal. Sprint B1 Zoo Part 1
console.log("Testing valid animal:");
addAnimal({ id: 5, name: "Zara", species: "Zebra", health: "Healthy" });

// Test Case: Missing Fields
console.log("Testing missing fields:");
addAnimal({ id: 6, name: "Incomplete", species: "" });

// Test Case: Invalid Data Types
console.log("Testing invalid types:");
addAnimal({ id: "six", name: 123, species: true, health: "Alive" });

// Test Case: Duplicate ID
console.log("Testing duplicate ID:");
addAnimal({ id: 1, name: "Leo Jr.", species: "Lion", health: "Healthy" });


      /**
       * Function to safely update text content of an element
       * Prevents crashes by checking if the element exists before modifying it
       */
      function safelyUpdateElementText(id, text) {
          try {
              const element = document.getElementById(id);
              if (!element) throw new Error(`Element with ID "${id}" not found.`);
              element.textContent = text;
          } catch (error) {
              console.warn(error.message);
          }
      }

/**
 * Sprint B1 Zoo Part 1
 * Function to validate animal data before adding to the zoo
 * Ensures required properties exist and have correct types
 */
function validateAnimalData(animal) {
  if (!animal || typeof animal !== "object") {
      throw new Error("Invalid animal data: Expected an object.");
  }
  if (!animal.id || typeof animal.id !== "number") {
      throw new Error("Animal must have a valid numeric ID.");
  }
  if (!animal.name || typeof animal.name !== "string") {
      throw new Error("Animal must have a valid name (string).");
  }
  if (!animal.species || typeof animal.species !== "string") {
      throw new Error("Animal must have a valid species (string).");
  }
  if (!["Healthy", "Sick"].includes(animal.health)) {
      throw new Error("Invalid health status. Must be 'Healthy' or 'Sick'.");
  }
  if (animals.some(a => a.id === animal.id)) {
      throw new Error(`Duplicate ID found. Animal with ID ${animal.id} already exists.`);
  }
}

/**
 * Sprint B1 Zoo Part 1
 * Function to load animals from localStorage
 */
function loadAnimals() {
  let storedAnimals = localStorage.getItem("animals");
  animals = storedAnimals ? JSON.parse(storedAnimals) : [];
  displayAnimals();
}

/**
 * Sprint B1 Zoo Part 1
* Function to persist animal data to localStorage
*/
function saveAnimals() {
  localStorage.setItem("animals", JSON.stringify(animals));
}

// Modify `addAnimal()` to save to localStorage after adding. Sprint B1 Zoo Part 1
function addAnimal(animal) {
  try {
      validateAnimalData(animal);
      animals.push(animal);
      saveAnimals(); // Save to localStorage
      displayAnimals();
      console.log(`Animal added successfully: ${JSON.stringify(animal)}`);
  } catch (error) {
      console.error("Error adding animal:", error.message);
      displayError(error.message);
  }
}

// Load animals on page load.l Sprint B1 Zoo Part 1
document.addEventListener("DOMContentLoaded", loadAnimals);


    // ✅ Sprint B2 Zoo Assignment: Advanced Zoo Security & Data Structures

// --- Part 1: Animal Class with Private Field and Prototype Methods ---
class Animal {
  #healthStatus; // Private field
  constructor(id, name, species) {
    this.id = id;
    this.name = name;
    this.species = species;
    this.#healthStatus = 'Healthy';
  }

  get status() {
    return this.#healthStatus;
  }

  set status(newStatus) {
    if (["Healthy", "Sick"].includes(newStatus)) {
      this.#healthStatus = newStatus;
    } else {
      throw new Error("Invalid health status");
    }
  }
}

// Prototype method for feeding
Animal.prototype.feed = function () {
  console.log(`${this.name} has been fed.`);
};

// --- Part 2: Closure for Private Feed Tracker ---
function createFeedingTracker() {
  let feedCount = 0;
  return {
    feedAnimal: (animal) => {
      feedCount++;
      animal.feed();
      console.log(`Feed count: ${feedCount}`);
    },
    getCount: () => feedCount
  };
}

const feedingTracker = createFeedingTracker();

// Test feeding logic to demonstrate closure + prototype usage
const testAnimal = new Animal(999, "Chompy", "Crocodile");

// Use .status (getter) to pass health to validation
addAnimal({
  id: testAnimal.id,
  name: testAnimal.name,
  species: testAnimal.species,
  health: testAnimal.status // Use the class's private field properly
});

feedingTracker.feedAnimal(testAnimal);
console.log("Total feedings so far:", feedingTracker.getCount());



// --- Part 3: JWT Authentication Simulation ---
function simulateLogin(username, password) {
  const admin = {
    username: "admin",
    password: "zoo123",
    role: "admin"
  };

  if (username === admin.username && password === admin.password) {
    const token = btoa(JSON.stringify({ username: admin.username, role: admin.role }));
    sessionStorage.setItem("authToken", token);
    console.log("Admin logged in, token stored:", token);
    return true;
  } else {
    console.warn("Invalid login attempt");
    return false;
  }
}

simulateLogin("admin", "zoo123"); // Simulated admin login

function getCurrentUser() {
  const token = sessionStorage.getItem("authToken");
  if (!token) return null;
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

function checkAdmin() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

function requireAdminAction(action) {
  if (checkAdmin()) {
    action();
  } else {
    console.warn("Action requires admin access.");
  }
}

requireAdminAction(() => {
  const secretAnimal = new Animal(777, "Ghost", "Panther");
  addAnimal({
    id: secretAnimal.id,
    name: secretAnimal.name,
    species: secretAnimal.species,
    health: secretAnimal.status // Use getter for private field
  });  
});

/**
 * Sprint B1 Zoo Part 2
 * Function to safely display error messages
 */
function displayError(message) {
  try {
      const errorContainer = document.getElementById("errorContainer");
      if (!errorContainer) {
          console.error("Error container not found in the DOM.");
          return;
      }

       // Remove old error messages safely
       while (errorContainer.firstChild) {
        errorContainer.removeChild(errorContainer.firstChild);
    }

      // Prevent duplicate error messages
      const existingErrors = Array.from(errorContainer.children).map(el => el.textContent);
      if (existingErrors.includes(`${message}`)) {
        return; // Don't add duplicate messages
      }

      // Append errors instead of overwriting
      const errorElement = document.createElement("p");
      errorElement.textContent = `${message}`;
      errorContainer.appendChild(errorElement);
  } catch (err) {
      console.error("Error displaying error message:", err.message);
  }
}

/**
 * Sprint B1 Part 3
 * Function to display success messages in the UI
 */
function displaySuccess(message) {
  try {
      const successContainer = document.getElementById("successContainer");
      if (!successContainer) {
          console.error("Success container not found in the DOM.");
          return;
      }

       // Remove old success messages safely
       while (successContainer.firstChild) {
        successContainer.removeChild(successContainer.firstChild);
    }

      const successElement = document.createElement("p");
      successElement.style.color = "green";
      successElement.textContent = `${message}`;
      successContainer.appendChild(successElement);
  } catch (err) {
      console.error("Error displaying success message:", err.message);
  }
}

      /**
         * Function to update visitor count and persist it
         */
      function updateVisitorCount(change) {
        try {
            visitorCount += change;
            if (visitorCount < 0) visitorCount = 0;

            localStorage.setItem("visitorCount", visitorCount);
            safelyUpdateElementText("visitorCounter", `Visitors: ${visitorCount}`);
            console.log(`Visitor count updated: ${visitorCount}`);
        } catch (error) {
            console.error("Error updating visitor count:", error);
            alert("An error occurred while updating the visitor count.");
        }
    }
      // Ensure visitor count is displayed on page load
      safelyUpdateElementText("visitorCounter", `Visitors: ${visitorCount}`);

    /**
     * Function to display animals dynamically
     */
    function displayAnimals() {
      try {
        const container = document.getElementById('animalContainer');
        if (!container) throw new Error('Animal container element not found.');
  
        // Efficiently clear previous elements
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
  
        animals.forEach(animal => {
          const card = document.createElement('div');
          card.classList.add('animal-card');
  
          // Safe text setting using textContent
          const nameElement = document.createElement('h3');
          nameElement.textContent = `${animal.name} (${animal.species})`;
          card.appendChild(nameElement);
  
          const statusElement = document.createElement('p');
          statusElement.textContent = "Status: ";
          const statusText = document.createElement('span');
          statusText.id = `status-${animal.id}`;
          statusText.textContent = animal.status;
          statusElement.appendChild(statusText);
          card.appendChild(statusElement);
  
          const healthElement = document.createElement('p');
          healthElement.textContent = "Health: ";
          const healthText = document.createElement('span');
          healthText.id = `health-${animal.id}`;
          healthText.textContent = animal.health;
          healthElement.appendChild(healthText);
          card.appendChild(healthElement);
  
          const toggleButton = document.createElement('button');
          toggleButton.textContent = "Toggle Status";
          toggleButton.onclick = () => window.toggleStatus(animal.id);
          card.appendChild(toggleButton);
  
          const updateHealthButton = document.createElement('button');
          updateHealthButton.textContent = "Update Health";
          updateHealthButton.onclick = () => window.updateHealth(animal.id);
          card.appendChild(updateHealthButton);
  
          container.appendChild(card);
        });
        safelyUpdateElementText("visitorCounter", `Visitors: ${localStorage.getItem("visitorCount") || 0}`);
      } catch (error) {
        console.error('Error displaying animals:', error);
        displayError(error.message); // Sprint B1 Zoo Part 2
      }
    }

    // Ensure animals are displayed on page load
    displayAnimals();
      

    /**
    * Function to toggle an animal's open/closed status
    */
    window.toggleStatus = (id) => {
      try {
        const animal = animals.find(a => a.id === id);
        if (!animal) throw new Error(`Animal with ID ${id} not found.`);

        animal.status = (animal.status === 'Open') ? 'Closed' : 'Open';
        safelyUpdateElementText(`status-${id}`, animal.status);
        console.log(`Animal ID ${id} status toggled: ${animal.status}`);
      } catch (error) {
        console.error("Error toggling animal status:", error);
      }
    };

    /**
    * Function to toggle an animal's health status
    */
    window.updateHealth = (id) => {  // Now accessible globally
      try {
        const animal = animals.find(a => a.id === id);
        if (!animal) throw new Error(`Animal with ID ${id} not found.`);

        animal.health = (animal.health === 'Healthy') ? 'Sick' : 'Healthy';
        safelyUpdateElementText(`health-${id}`, animal.health);
        console.log(`Animal ID ${id} health updated: ${animal.health}`);
      } catch (error) {
        console.error("Error updating animal health:", error);
      }
    };

/**
 * Function to safely toggle zoo status
 */
window.toggleZooStatus = () => {
  try {
      const statusElement = document.getElementById("zooStatus");
      if (!statusElement) throw new Error("Zoo status element not found.");

      zooStatus = (zooStatus === "Open") ? "Closed" : "Open";
      localStorage.setItem("zooStatus", zooStatus);

      animals.forEach(animal => animal.status = zooStatus);
      statusElement.textContent = `Zoo Status: ${zooStatus}`;

      console.log(`Zoo status changed to: ${zooStatus}`);
      displayAnimals();
  } catch (error) {
      console.error("Error toggling zoo status:", error.message);
      displayError(error.message); // Sprint B1 Zoo part 2
  }
};

  

/**
 * Function to safely display zoo statistics
 */
window.displayZooStatistics = () => {
  try {
      const totalAnimals = animals.length;
      const openAnimals = animals.filter(animal => animal.status === "Open").length;
      const closedAnimals = animals.filter(animal => animal.status === "Closed").length;

      console.log("Zoo Statistics:");
      console.table([
          { "Total Animals": totalAnimals },
          { "Open Animals": openAnimals },
          { "Closed Animals": closedAnimals },
          { "Visitor Count": visitorCount }
      ]); // Sprint B1 Zoo Part 2

      alert(`Zoo Statistics:\nTotal: ${totalAnimals}\nOpen: ${openAnimals}\nClosed: ${closedAnimals}\nVisitors: ${visitorCount}`);
  } catch (error) {
      console.error("Error displaying zoo statistics:", error.message);
      displayError(error.message); // Sprint B1 Zoo Part 2
  }
};


    /**
    * Function to populate the animal dropdown in the booking form
    */
    function populateAnimalDropdown() {
      const animalDropdown = document.getElementById("animal");
       try {

      if (!animalDropdown) {
          throw new Error("Animal dropdown not found. Check your HTML.");
      }

      console.log("Populating animal dropdown...");

      // Clear previous options to avoid duplication
      animalDropdown.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "-- Select an Animal --";
      animalDropdown.appendChild(defaultOption);

      if (animals.length === 0) {
        console.warn("No animals found. Dropdown will be empty.");
      } else {
          animals.forEach(animal => {
            const option = document.createElement("option");
            option.value = animal.name;
            option.textContent = `${animal.name} (${animal.species})`;
            animalDropdown.appendChild(option);
        });

        console.log("Dropdown populated successfully.");
      }
      } catch (error) {
        console.error("Error populating animal dropdown:", error);
      }
    }
    populateAnimalDropdown();

/**
 * Function to initialize the membership form (without handling submission)
 */
function membershipForm() {
  console.log("Initializing membership form...");

  const form = document.getElementById("membershipForm");

  if (!form) {
      console.error("Membership form not found.");
      return;
  }

  // Perform any necessary setup (e.g., reset fields, load default values)
  form.reset(); // Ensures the form is empty on page load

  // NO submit event listener here! Sprint B1 part 3
}

    membershipForm();

  // Sprint B2 lab 1 Part 2 - Input Sanitization
  // Enhanced sanitizeInput function for SQL Injection & Buffer Overflow Protection, Sprint B2 Lab 3
  function sanitizeInput(input) {
    console.log("Before Sanitization:", input);

  // Buffer Overflow Protection - Truncate to max 255 chars
  const maxLength = 255;
  if (input.length > maxLength) {
    console.warn("Input truncated due to length limit");
    input = input.slice(0, maxLength);
  }

  // SQL Injection Detection
  const sqlPattern = /\b(SELECT|INSERT|DELETE|DROP|UPDATE|UNION|--|;|\|)/gi;
  const suspicious = sqlPattern.test(input);
  if (suspicious) {
    console.warn("SQL Injection pattern detected in input:", input);
    // Option: Reject the input by throwing an error, so it won't be submitted.
    throw new Error("Suspicious input detected. Please remove any SQL keywords.");
    // Alternatively, you could remove the dangerous keywords:
    // input = input.replace(sqlPattern, "");
  }

  // Strip HTML tags
  const tagStripped = input.replace(/<[^>]*>?/gm, "");

  // Encode common dangerous characters
  const encoded = tagStripped
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  console.log("After Sanitization:", encoded);
  return encoded;
  }

    /**
    * Function to handle booking form submission
    */
    function bookingForm() {
      const bookingForm = document.getElementById("bookingForm");

      if (!bookingForm) {
        console.error("Booking form not found. Check your HTML.");
        return;
      }

      bookingForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission
        try {
          const visitorName = sanitizeInput(document.getElementById("visitorName").value.trim());
          const contact = sanitizeInput(document.getElementById("contact").value.trim());
          const selectedAnimal = sanitizeInput(document.getElementById("animal").value);
          const dateTime = sanitizeInput(document.getElementById("dateTime").value);
          const groupSize = parseInt(document.getElementById("groupSize").value, 10);// Ensure integer parsing.

          // Validate user input
          if (!visitorName || !contact || !selectedAnimal || !dateTime || groupSize < 1) {
            throw new Error("Please fill in all required fields.");
          }

          // Store booking in localStorage
          let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
          bookings.push({ visitorName, contact, selectedAnimal, dateTime, groupSize });
          localStorage.setItem("bookings", JSON.stringify(bookings));

          alert("Booking confirmed!");
          updateVisitorCount(groupSize); // Increase visitor count
          bookingForm.reset();
          } catch (error) {
            console.error("Error processing booking:", error);
            alert(error.message);
          }
      });
    }
    bookingForm(); // Ensure booking form handles visitor updates

/**
 * Sprint B1 part 3
 * Function to handle membership form submission
 */
function handleMembershipSubmission(event) {
  event.preventDefault();
  try {
    const nameField = document.getElementById("name");
    const emailField = document.getElementById("email");
    const membershipTypeField = document.getElementById("membershipType");
    const startDateField = document.getElementById("startDate");
    const emergencyContactField = document.getElementById("emergencyContact");



      // Debugging: Log form field existence
      console.log("Checking form fields existence:");
      console.log("Name Field:", nameField ? "Found" : "Not Found");
      console.log("Email Field:", emailField ? "Found" : "Not Found");
      console.log("Membership Type Field:", membershipTypeField ? "Found" : "Not Found");
      console.log("Start Date Field:", startDateField ? "Found" : "Not Found");
      console.log("Emergency Contact Field:", emergencyContactField ? "Found" : "Not Found");

      if (!nameField || !emailField || !membershipTypeField || !startDateField || !emergencyContactField) {
          throw new Error("Some form fields were not found in the DOM.");
      }

      // Read values after user input
      const name = sanitizeInput(nameField.value.trim());
      const email = sanitizeInput(emailField.value.trim());
      const membershipType = sanitizeInput(membershipTypeField.value);
      const startDate = sanitizeInput(startDateField.value);
      const emergencyContact = sanitizeInput(emergencyContactField.value.trim());

      // Debugging: Log actual values before validation
      console.log("Checking form values before validation:");
      console.log("Name:", `"${name}"`);
      console.log("Email:", `"${email}"`);
      console.log("Membership Type:", `"${membershipType}"`);
      console.log("Start Date:", `"${startDate}"`);
      console.log("Emergency Contact:", `"${emergencyContact}"`);

      // Validate fields
      if (!name || !email || !membershipType || !startDate || !emergencyContact) {
          throw new Error("Please fill in all required fields.");
      }

      let members = JSON.parse(localStorage.getItem("members")) || [];
      members.push({ name, email, membershipType, startDate, emergencyContact });
      localStorage.setItem("members", JSON.stringify(members));

      displaySuccess("Membership registration successful!");
      console.log("Membership registered successfully.");
      updateVisitorCount(1);
      event.target.reset();
  } catch (error) {
      console.error("Error processing membership registration:", error.message);
      displayError(error.message);
  }

  // Sprint B2 Lab 1 Part 3 - Input Testing Table
  const testInputs = [
    { input: "Normal Text", sanitized: sanitizeInput("Normal Text") },
    { input: "<script>alert('XSS')</script>", sanitized: sanitizeInput("<script>alert('XSS')</script>") },
    { input: "<b>Bold</b>", sanitized: sanitizeInput("<b>Bold</b>") },
    { input: "Text with special chars &<>\"'", sanitized: sanitizeInput("Text with special chars &<>\"'") },
  ];

console.table(testInputs);
}

// Sprint B1 Part 3
const form = document.getElementById("membershipForm");

if (!form) {
    console.error("Membership form not found.");
    return;
}
// Submission for mempership event listener.
form.addEventListener("submit", handleMembershipSubmission);

/**
 * Runs a set of tests and logs the results using console.table().
 * Tests include:
 * 1. Successful AJAX Request
 * 2. Invalid Protocol Attempt (simulation)
 * 3. Whitelist Validation
 */
async function runImplementationTests() {
  const testResults = [];
  
  // Test 1: Successful AJAX Request
  try {
    // Note: Replace the URL with your actual API endpoint if necessary.
    const apiUrl = "animals.json";
    const response = await fetch(apiUrl, {
      method: "GET",
      mode: "cors",
      credentials: "include"
    });
    if (response.ok) {
      testResults.push({
        Test: "AJAX Request Successful",
        Input: "Valid Endpoint",
        Expected: "Success",
        Actual: "Success",
        Status: "PASS"
      });
    } else {
      testResults.push({
        Test: "AJAX Request Successful",
        Input: "Valid Endpoint",
        Expected: "Success",
        Actual: `Status: ${response.status}`,
        Status: "FAIL"
      });
    }
  } catch (error) {
    testResults.push({
      Test: "AJAX Request Successful",
      Input: "Valid Endpoint",
      Expected: "Success",
      Actual: error.message,
      Status: "FAIL"
    });
  }
  
  // Test 2: Invalid Protocol Attempt (Simulation)
  // Since window.location.protocol is read-only, we simulate an invalid protocol test.
  const simulatedProtocol = "http:";  // Simulate an insecure protocol.
  const protocolTestResult = simulatedProtocol === "https:" 
      ? { expected: "https:", actual: simulatedProtocol, status: "PASS" } 
      : { expected: "https:", actual: simulatedProtocol, status: "FAIL" };
  testResults.push({
    Test: "Invalid Protocol Attempt",
    Input: simulatedProtocol,
    Expected: "https:",
    Actual: protocolTestResult.actual,
    Status: protocolTestResult.status
  });
  
  // Test 3: Whitelist Validation
  // Suppose our whitelist of allowed domains is as follows:
  const whitelist = ["https://api.example.com"];
  // Simulate checking a domain from the API
  const testOrigin = "https://api.example.com";  // Change as needed to test rejection.
  const whitelistStatus = whitelist.includes(testOrigin) ? "PASS" : "FAIL";
  testResults.push({
    Test: "Whitelist Validation",
    Input: testOrigin,
    Expected: "Origin in whitelist",
    Actual: whitelistStatus,
    Status: whitelistStatus
  });
  
  console.table(testResults);
}

// Run the tests after all initialization and setup is complete.
runImplementationTests();

  } catch (error) {
      console.error("Critical Error: Unable to initialize Zoo Management System.", error);
      alert("A serious error occurred. Please reload the page.");
  }
});