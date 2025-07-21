window.addEventListener("DOMContentLoaded", async () => {
  try {
    const models = await eel.get_all_models_metadata()();

    models.sort((a, b) => {
      const dateA = a.last_updated_raw ? new Date(a.last_updated_raw).getTime() : 0;
      const dateB = b.last_updated_raw ? new Date(b.last_updated_raw).getTime() : 0;
      return dateB - dateA;
    });

    console.log(models.map(m => m.last_updated_raw));

    console.log("מודלים שהתקבלו:", models);

    if (models.length > 0) {
      console.log(" דוגמה למודל:", models[0]);
    }

    const container = document.getElementById("models-container");

models.forEach(model => {
  const row = document.createElement("div");
  row.className = "qa-row";

let actionsHtml = `
  <button class="model-action-btn edit-btn" data-slug="${model.slug}" title="עריכת מאגר">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 20h9" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  </button>
`;

if (model.tweaks > 0) {
  actionsHtml += `
  <button class="model-action-btn open-folder-btn" data-name="${model.name}" title="פתיחת תיקיית המודל">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.75V6a1 1 0 0 1 1-1h6l2 2h8a1 1 0 0 1 1 1v1.75M3 7.75V18a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7.75H3Z" />
    </svg>
  </button>
    <button class="model-action-btn test-btn" data-slug="${model.slug}" title="בדיקת המודל">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2l4-4M12 3v2m6.364 1.636l-1.414 1.414M21 12h-2m-1.636 6.364l-1.414-1.414M12 21v-2m-6.364-1.636l1.414-1.414M3 12h2m1.636-6.364l1.414 1.414" />
    </svg>
  </button>

  `;
}

actionsHtml += `
  <button class="model-action-btn delete-btn" data-name="${model.name}" title="מחיקת המודל">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M10 11v6M14 11v6M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  </button>`;


  row.innerHTML = `
    <div class="qa-box">${model.name}</div>
    <div class="qa-box">${model.user}</div>
    <div class="qa-box">${model.description}</div>
    <div class="qa-box">${model.tweaks}</div>
    <div class="qa-box">${model.updated_at}</div>
    <div class="model-actions">${actionsHtml}</div>
  `;

  container.appendChild(row);

  row.querySelector(".edit-btn").addEventListener("click", () => {
    internalNavigation = true;
    window.location.href = `edit-dataset.html?slug=${encodeURIComponent(model.slug)}`;
  });

  const testBtn = row.querySelector(".test-btn");
  if (testBtn) {
  testBtn.addEventListener("click", () => {
    internalNavigation = true;
    window.location.href = `test-model.html?slug=${encodeURIComponent(model.slug)}`;
  });
  }

  if (model.tweaks > 0) {
    const openBtn = row.querySelector(".open-folder-btn");
    if (openBtn) {
    openBtn.addEventListener("click", async () => {
      const popup = document.getElementById("export-loading-popup");
      popup.classList.remove("hidden");

      try {
        const res = await eel.open_or_export_model(model.slug)();

        if (!res.success) {
          alert(" שגיאה בפתיחת התיקייה: " + (res.error || ""));
        }

        if (res.already_exported) {
          popup.classList.add("hidden");
        } else {
          setTimeout(() => popup.classList.add("hidden"), 2000);
        }
      } catch (err) {
        console.error(err);
        popup.classList.add("hidden");
        alert("שגיאה בלתי צפויה");
      }
    });
    }
  }

 row.querySelector(".delete-btn").addEventListener("click", () => {
  showPopup({
    title: `מחיקת מודל`,
    subtitle: `האם אתה בטוח שברצונך למחוק את המודל:<br>"${model.name}"?<br><br><b>פעולה זו אינה הפיכה!</b>`,
    onConfirm: () => {
      eel.delete_model_folder(model.slug)().then(res => {
        if (res.success) {
          row.remove();
        } else {
          showPopup({
            title: "שגיאה",
            subtitle: res.error || "אירעה שגיאה במחיקה.",
          });
        }
      });
    }
  });
});
});

    document.getElementById("back-button").addEventListener("click", () => {
    internalNavigation = true;
      window.location.href = "home.html";
    });

  } catch (err) {
    console.error("שגיאה בטעינת המודלים:", err);
  }
});
