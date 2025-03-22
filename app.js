let passwordData = [];

// Load passwords.xlsx on page load
window.onload = function() {
  fetch('passwords.xlsx')
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      populateSiteDropdown(jsonData);
    })
    .catch(err => {
      console.error("Failed to load passwords.xlsx:", err);
      alert("Error: Couldn't load passwords.xlsx! Please ensure it's in the same folder.");
    });
};

function populateSiteDropdown(data) {
  const siteDropdown = document.getElementById('siteSelect');
  siteDropdown.innerHTML = "<option value=''>-- Select --</option>";

  passwordData = []; // clear previous

  data.forEach((row, index) => {
    if (index === 0) return; // skip header row

    const siteName = row[0];
    const simplePassword = row[1];

    if (!siteName || !simplePassword) return;

    passwordData.push({ siteName, simplePassword });

    const option = document.createElement('option');
    option.value = index - 1; // index in passwordData
    option.textContent = siteName;

    siteDropdown.appendChild(option);
  });
}

function fillInputsFromDropdown() {
  const select = document.getElementById('siteSelect');
  const index = select.value;

  if (index === "") return;

  const entry = passwordData[index];

  document.getElementById('siteName').value = entry.siteName;
  document.getElementById('simplePassword').value = entry.simplePassword;
}

function generatePassword() {
  const siteName = document.getElementById('siteName').value.trim();
  const simplePassword = document.getElementById('simplePassword').value.trim();
  const secretSalt = document.getElementById('secretSalt').value.trim();
  const length = parseInt(document.getElementById('length').value);

  if (!siteName || !simplePassword || !secretSalt) {
    alert("Missing data! Select a site and enter your secret salt.");
    return;
  }

  const inputText = simplePassword + secretSalt;
  const password = customHash(inputText, length);

  document.getElementById('passwordOutput').textContent = password;
  document.getElementById("resultContainer").style.display = "block";

  // Reset copy message if already shown
  document.getElementById("copyMsg").style.display = "none";
}

function copyPassword() {
  const password = document.getElementById("passwordOutput").textContent;

  if (!password) {
    alert("No password to copy!");
    return;
  }

  if (!navigator.clipboard) {
    // fallback for older browsers
    const tempInput = document.createElement("input");
    tempInput.value = password;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    showCopyMsg();
    return;
  }

  navigator.clipboard.writeText(password)
    .then(() => {
      showCopyMsg();
    })
    .catch(err => {
      console.error("Failed to copy:", err);
      alert("Copy failed. Try manually selecting the password.");
    });
}

function showCopyMsg() {
  const copyMsg = document.getElementById("copyMsg");
  copyMsg.style.display = "block";
  copyMsg.textContent = "Password copied to clipboard!";
  setTimeout(() => {
    copyMsg.style.display = "none";
  }, 2000);
}


function customHash(text, length = 10) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "@#&";
  const allChars = upper + lower + numbers + symbols;

  // Generate a base hash code (simple hash)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  function pseudoRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  let passwordArray = [
    upper[Math.floor(pseudoRandom(hash + 1) * upper.length)],
    lower[Math.floor(pseudoRandom(hash + 2) * lower.length)],
    numbers[Math.floor(pseudoRandom(hash + 3) * numbers.length)],
    symbols[Math.floor(pseudoRandom(hash + 4) * symbols.length)]
  ];

  for (let i = passwordArray.length; i < length; i++) {
    const index = Math.floor(pseudoRandom(hash + i) * allChars.length);
    passwordArray.push(allChars[index]);
  }

  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom(hash + i) * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(err => {
        console.log('Service Worker registration failed:', err);
      });
  });
}
