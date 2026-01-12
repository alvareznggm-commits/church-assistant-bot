(function () {
  // ----- STYLE HELPERS -----
  function style(el, props) {
    Object.assign(el.style, props);
  }

  // ----- CREATE BUBBLE BUTTON -----
  const bubble = document.createElement("div");
  bubble.id = "church-assistant-bubble";
  bubble.innerText = "?";
  style(bubble, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "#1f2937",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: "9999",
    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    fontSize: "24px",
    fontFamily: "system-ui, sans-serif"
  });

  // ----- CHAT PANEL -----
  const panel = document.createElement("div");
  panel.id = "church-assistant-panel";
  style(panel, {
    position: "fixed",
    bottom: "80px",
    right: "20px",
    width: "320px",
    maxHeight: "400px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    display: "none",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: "9999",
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px"
  });

  // Header
  const header = document.createElement("div");
  header.innerText = "Need info or help?";
  style(header, {
    padding: "10px 12px",
    backgroundColor: "#1f2937",
    color: "#fff",
    fontWeight: "600"
  });

  // Disclaimer
  const disclaimer = document.createElement("div");
  disclaimer.innerText =
    "Info only – no counseling or spiritual advice. Messages may be routed to church staff.";
  style(disclaimer, {
    padding: "8px 12px",
    fontSize: "11px",
    color: "#4b5563",
    borderBottom: "1px solid #e5e7eb"
  });

  // Messages area
  const messages = document.createElement("div");
  style(messages, {
    flex: "1",
    padding: "8px 12px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column"
  });

  // Quick buttons area
  const buttons = document.createElement("div");
  style(buttons, {
    padding: "8px 12px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px"
  });

  // Prayer form (hidden until needed)
  const prayerForm = document.createElement("div");
  style(prayerForm, {
    padding: "8px 12px",
    borderTop: "1px solid #e5e7eb",
    display: "none",
    flexDirection: "column",
    gap: "6px"
  });

  
 const prayerLabel = document.createElement("div");
  prayerLabel.innerText = "Share a prayer request (sent to prayer team):";

  const prayerTextarea = document.createElement("textarea");
  prayerTextarea.rows = 3;
  style(prayerTextarea, {
    width: "100%",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: "13px",
    padding: "4px"
  });

const nameInput = document.createElement("input");
nameInput.type = "text";
nameInput.placeholder = "Your name";
style(nameInput, {
  width: "100%",
  fontFamily: "inherit",
  fontSize: "13px",
  padding: "4px"
});

const phoneInput = document.createElement("input");
phoneInput.type = "tel";
phoneInput.placeholder = "Phone";
style(phoneInput, {
  width: "100%",
  fontFamily: "inherit",
  fontSize: "13px",
  padding: "4px"
});
  
const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.placeholder = "Your email";
  style(emailInput, {
    width: "100%",
    fontFamily: "inherit",
    fontSize: "13px",
    padding: "4px"
  });

  const sendPrayerBtn = document.createElement("button");
  sendPrayerBtn.innerText = "Send request";
  style(sendPrayerBtn, {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    alignSelf: "flex-end"
  });

  prayerForm.appendChild(prayerLabel);
  prayerForm.appendChild(prayerTextarea);
  prayerForm.appendChild(prayerLabel);
  prayerForm.appendChild(prayerTextarea);
  prayerForm.appendChild(nameInput);
  prayerForm.appendChild(phoneInput);
  prayerForm.appendChild(emailInput);
  prayerForm.appendChild(sendPrayerBtn);


  // ----- ADD MESSAGE BUBBLES -----
  function addMessage(text, isUser) {
    const msg = document.createElement("div");
    msg.innerText = text;
    style(msg, {
      marginBottom: "6px",
      padding: "6px 8px",
      borderRadius: "8px",
      maxWidth: "90%",
      backgroundColor: isUser ? "#e5e7eb" : "#eff6ff",
      alignSelf: isUser ? "flex-end" : "flex-start"
    });
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  // ----- API CALL -----
  // Determine churchId from script tag
  const thisScript = document.currentScript;
  const churchId = thisScript.getAttribute("data-church-id") || "default";
  const API_URL = "https://church-assistant-bot.onrender.com/bot"; // change to Render URL later

  async function sendIntent(intent, label) {
    addMessage(label, true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchId, intent })
      });
      const data = await res.json();
      addMessage(data.response || "Thank you. Someone will follow up.", false);
    } catch (err) {
      console.error("Assistant error:", err);
      addMessage("Sorry, something went wrong. Please contact the church office directly.", false);
    }
  }

  async function sendPrayer() {
   const text = prayerTextarea.value.trim();
   const name = nameInput.value.trim();
   const phone = phoneInput.value.trim();
   const email = emailInput.value.trim();


    if (!text) {
      alert("Please enter a prayer request.");
      return;
    }

    addMessage("Prayer request submitted", true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          churchId,
          intent: "prayer-request",
          message: text,
           name,
  	   phone,
           email
        })
      });
      const data = await res.json();
      addMessage(data.response || "Thank you. Your request has been sent.", false);
      prayerTextarea.value = "";
      emailInput.value = "";
      prayerForm.style.display = "none";
    } catch (err) {
      console.error("Prayer send error:", err);
      addMessage("Sorry, we couldn't send your request. Please contact the church directly.", false);
    }
  }

  sendPrayerBtn.addEventListener("click", sendPrayer);

  // ----- QUICK BUTTONS -----
  function makeButton(label, intent) {
    const btn = document.createElement("button");
    btn.innerText = label;
    style(btn, {
      padding: "6px 10px",
      borderRadius: "999px",
      border: "1px solid #d1d5db",
      backgroundColor: "#f9fafb",
      cursor: "pointer",
      fontSize: "12px"
    });
    btn.addEventListener("click", () => sendIntent(intent, label));
    return btn;
  }

  const serviceBtn = makeButton("Service times", "service-times");
  const locationBtn = makeButton("Location & parking", "location");
  const prayerBtn = makeButton("Prayer request", "prayer-request-open");

  prayerBtn.addEventListener("click", () => {
    prayerForm.style.display = prayerForm.style.display === "none" ? "flex" : "none";
  });

  buttons.appendChild(serviceBtn);
  buttons.appendChild(locationBtn);
  buttons.appendChild(prayerBtn);

  // Assemble panel
  panel.appendChild(header);
  panel.appendChild(disclaimer);
  panel.appendChild(messages);
  panel.appendChild(buttons);
  panel.appendChild(prayerForm);

  // Add to DOM
  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  // Bubble click toggles panel
  bubble.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "flex" : "none";
  });

})();
