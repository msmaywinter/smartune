window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const modelName = urlParams.get("name");

    const count = parseInt(urlParams.get("count"));
    
    const slider = document.getElementById("setsSlider");
    const thumbValue = document.getElementById("thumb-value");
    const minLabel = document.getElementById("min-label");
    const maxLabel = document.getElementById("max-label");
    const continueButton = document.querySelector(".bottom-buttons .nav-button:last-child");
    
    // מזיז את התצוגה המקורית - מסתיר אותה אבל משאיר אותה בדף כדי לשמור על הערך שלה
    slider.style.opacity = "0";
    slider.style.position = "absolute";
    slider.style.pointerEvents = "none";
    
    // יוצר סליידר חדש מותאם אישית
    const sliderContainer = document.createElement("div");
    sliderContainer.className = "custom-slider-container";
    sliderContainer.style.width = "100%";
    sliderContainer.style.height = "20px";
    sliderContainer.style.position = "relative";
    sliderContainer.style.borderRadius = "10px";
    sliderContainer.style.cursor = "pointer";
    sliderContainer.style.background = "#eef9fd";
    
    // יוצר את החלק הצבוע של הסליידר
    const sliderFill = document.createElement("div");
    sliderFill.className = "custom-slider-fill";
    sliderFill.style.height = "100%";
    sliderFill.style.width = "0%";
    sliderFill.style.background = "#004051";
    sliderFill.style.borderRadius = "10px 0 0 10px";
    sliderFill.style.position = "absolute";
    sliderFill.style.left = "0";
    sliderFill.style.top = "0";
    
    // הוספת סגנון CSS לתמיכה באנימציה
    const styleElement = document.createElement("style");
    styleElement.textContent = `
        .custom-slider-fill {
            transition: width 0.3s ease;
        }
        .no-transition {
            transition: none !important;
        }
    `;
    document.head.appendChild(styleElement);
    
    // מוסיף את הסליידר המותאם אישית לאחר האלמנט המקורי
    slider.insertAdjacentElement('afterend', sliderContainer);
    sliderContainer.appendChild(sliderFill);
    
    // משתנים לעקיבה אחר גרירה
    let isDragging = false;
    
    // מינימום, מקסימום וערך נוכחי של הסליידר
    let min = 10;
    let max = 100;
    let step = 5;
    let currentValue = 50;
    
    if (!isNaN(count)) {
        max = Math.max(20, count * 2);
        slider.min = min;
        slider.max = max;
        slider.step = step;
        
        // התחל עם ערך אמצעי
        currentValue = Math.round((min + max) / 2);
        slider.value = currentValue;
        
        minLabel.textContent = min;
        maxLabel.textContent = max;
        
        continueButton.classList.remove("disabled-button");
    }
    
    // פונקציה לעדכון התצוגה של הסליידר
    function updateSliderUI() {
        // עדכון של האלמנט המקורי (מוסתר) לשמירת הערך
        slider.value = currentValue;
        
        // חישוב האחוז לפי הערך הנוכחי
        const percent = ((currentValue - min) / (max - min)) * 100;
        
        // עדכון רוחב החלק הצבוע
        sliderFill.style.width = `${percent}%`;
        
        // עדכון הטקסט והמיקום של העיגול
        thumbValue.textContent = currentValue;
        
        // חישוב המיקום האבסולוטי של העיגול
        const containerWidth = sliderContainer.offsetWidth;
        const thumbWidth = thumbValue.offsetWidth;
        const thumbLeft = (containerWidth * (percent / 100)) - (thumbWidth / 2);
        
        // עדכון מיקום העיגול
        thumbValue.style.left = `${thumbLeft}px`;
    }
    
    // פונקציה לחישוב הערך לפי מיקום העכבר
    function calculateValueFromPosition(clientX) {
        const rect = sliderContainer.getBoundingClientRect();
        let position = clientX - rect.left;
        position = Math.max(0, Math.min(position, rect.width));
        
        // חישוב האחוז של המיקום מתוך הרוחב הכולל
        const clickPercent = position / rect.width;
        
        // חישוב הערך החדש לפי האחוז
        let newValue = min + clickPercent * (max - min);
        
        // עיגול לערך המתאים לפי ה-step
        if (step && step !== 1) {
            newValue = Math.round(newValue / step) * step;
        } else {
            newValue = Math.round(newValue);
        }
        
        // הגבלת הערך לטווח המותר
        return Math.max(min, Math.min(max, newValue));
    }
    
    // אירוע לחיצה על הסליידר
    sliderContainer.addEventListener("mousedown", function(e) {
        isDragging = true;
        
        // ביטול האנימציה בזמן גרירה
        sliderFill.classList.add("no-transition");
        thumbValue.classList.add("no-transition");
        
        // עדכון הערך לפי המיקום של הלחיצה
        currentValue = calculateValueFromPosition(e.clientX);
        updateSliderUI();
        
        // הוספת מאזינים לגרירה
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    });
    
    // טיפול בתזוזת העכבר בזמן גרירה
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        currentValue = calculateValueFromPosition(e.clientX);
        updateSliderUI();
    }
    
    // טיפול בשחרור העכבר
    function handleMouseUp() {
        isDragging = false;
        
        // החזרת האנימציה לאחר שחרור הגרירה
        sliderFill.classList.remove("no-transition");
        thumbValue.classList.remove("no-transition");
        
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        
        // אפשר לעדכן שוב את ה-UI אחרי קצת זמן
        setTimeout(updateSliderUI, 10);
    }
    
    // לחיצה ישירה על הסליידר (לא גרירה)
    sliderContainer.addEventListener("click", function(e) {
        if (!isDragging) { // רק אם לא באמצע גרירה
            // וודא שהאנימציה מופעלת
            sliderFill.classList.remove("no-transition");
            thumbValue.classList.remove("no-transition");
            
            currentValue = calculateValueFromPosition(e.clientX);
            updateSliderUI();
        }
    });
    
    // תמיכה במכשירים ניידים
    sliderContainer.addEventListener("touchstart", function(e) {
        e.preventDefault();
        isDragging = true;
        
        // ביטול האנימציה בזמן גרירה
        sliderFill.classList.add("no-transition");
        thumbValue.classList.add("no-transition");
        
        currentValue = calculateValueFromPosition(e.touches[0].clientX);
        updateSliderUI();
        
        document.addEventListener("touchmove", handleTouchMove);
        document.addEventListener("touchend", handleTouchEnd);
    });
    
    function handleTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        currentValue = calculateValueFromPosition(e.touches[0].clientX);
        updateSliderUI();
    }
    
    function handleTouchEnd() {
        isDragging = false;
        
        // החזרת האנימציה לאחר שחרור
        sliderFill.classList.remove("no-transition");
        thumbValue.classList.remove("no-transition");
        
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        
        // אפשר לעדכן שוב את ה-UI אחרי קצת זמן
        setTimeout(updateSliderUI, 10);
    }
    
    continueButton.addEventListener("click", async () => {
        if (continueButton.classList.contains("disabled-button")) return;
    
        const selectedSets = currentValue; // כמות הסטים מהסליידר
        const modelName = urlParams.get("name"); // שם המודל
    
        if (!modelName) {
            alert("לא הוזן שם מודל!");
            return;
        }
    
        try {
            // קריאה לשרת: שולחים רק את מספר הסטים ואת שם המודל
            await eel.generate_sets(selectedSets, modelName)();
            
            // אחרי הצלחה - מעבר לדף הבא
            window.location.href = `generate-sets.html?sets=${selectedSets}&name=${encodeURIComponent(modelName)}`;
        } catch (error) {
            console.error("❌ שגיאה בשליחת בקשה לג'נרציה:", error);
            alert("קרתה שגיאה ביצירת הסטים. נסה שוב.");
        }
    });    
    
    // עדכון ראשוני של הסליידר
    updateSliderUI();
});