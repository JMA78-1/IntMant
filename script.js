document.addEventListener("DOMContentLoaded", () => {
  let eventList = [];
  let currentQueryDate = new Date().toISOString().split("T")[0];
  let eventIdToDelete = null;

  function loadEvents(date) {
    const savedEvents = localStorage.getItem(date);
    eventList = savedEvents ? JSON.parse(savedEvents) : [];
    updateEventTable();
  }

  function saveEvents(date) {
    localStorage.setItem(date, JSON.stringify(eventList));
  }

  const dateQueryElement = document.getElementById("date-query");
  if (dateQueryElement) {
    dateQueryElement.value = currentQueryDate;
    loadEvents(currentQueryDate);
  }

  window.addEvent = function () {
    const eventNumber = document.getElementById("event-number").value.trim();
    const eventDate = document.getElementById("event-date").value || currentQueryDate;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;
    const reason = document.getElementById("reason").value.trim();
    const photoInput = document.getElementById("event-photo");

    if (!eventNumber || !eventDate || !startTime || !endTime || !reason) {
      alert("Por favor, completa todos los campos del formulario.");
      return;
    }

    if (startTime >= endTime) {
      alert("La hora de fin no puede ser anterior o igual a la hora de inicio.");
      return;
    }

    const duration = calculateDuration(startTime, endTime);
    let photoUrl = "";

    if (photoInput.files && photoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        photoUrl = e.target.result;
        saveEvent(eventDate, eventNumber, startTime, endTime, reason, duration, photoUrl);
      };
      reader.readAsDataURL(photoInput.files[0]);
    } else {
      saveEvent(eventDate, eventNumber, startTime, endTime, reason, duration, photoUrl);
    }
  };

  function saveEvent(eventDate, eventNumber, startTime, endTime, reason, duration, photoUrl) {
    const event = {
      id: Date.now(),
      number: eventNumber,
      date: eventDate,
      start: startTime,
      end: endTime,
      duration: duration,
      reason: reason,
      photo: photoUrl
    };

    let eventListForDate = JSON.parse(localStorage.getItem(eventDate)) || [];
    eventListForDate.push(event);
    localStorage.setItem(eventDate, JSON.stringify(eventListForDate));

    if (eventDate === currentQueryDate) {
      eventList = eventListForDate;
      updateEventTable();
    }

    document.getElementById("event-form").reset();
  }

  function calculateDuration(start, end) {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    const durationMs = endTime - startTime;

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function updateEventTable() {
    const tbody = document.querySelector("#event-table tbody");
    tbody.innerHTML = "";

    eventList.forEach((event, index) => {
      const row = document.createElement("tr");
      row.setAttribute("data-id", event.id);

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${event.date}</td>
        <td>${event.start}</td>
        <td>${event.end}</td>
        <td>${event.duration}</td>
        <td>${event.reason}</td>
        <td><img src="${event.photo}" alt="Foto del evento" class="event-photo"></td>
        <td><button class="delete-btn" onclick="showConfirmDialog(${event.id})">Eliminar</button></td>
      `;
      tbody.appendChild(row);
    });
  }

  window.showConfirmDialog = function (id) {
    eventIdToDelete = id;
    document.getElementById("confirm-dialog").style.display = "flex";
  };

  window.closeConfirmDialog = function () {
    document.getElementById("confirm-dialog").style.display = "none";
  };

  document.getElementById("confirm-delete-btn").onclick = function () {
    deleteEvent(eventIdToDelete);
    closeConfirmDialog();
  };

  function deleteEvent(id) {
    const rowToDelete = document.querySelector(`[data-id="${id}"]`);
    if (rowToDelete) {
      rowToDelete.classList.add("fade-out");
      setTimeout(() => {
        rowToDelete.remove();
        eventList = eventList.filter((event) => event.id !== id);
        saveEvents(currentQueryDate);
      }, 300);
    }
  }

  window.queryEventsByDate = function () {
    const queryDateElement = document.getElementById("date-query");
    if (queryDateElement) {
      currentQueryDate = queryDateElement.value;
      loadEvents(currentQueryDate);
    }
  };

  window.showSaveAsDialog = function () {
    document.getElementById("save-as-dialog").style.display = "flex";
  };

  window.closeSaveAsDialog = function () {
    document.getElementById("save-as-dialog").style.display = "none";
  };

  function saveAsPDF(fileName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ encoding: "UTF-8" });

    doc.setFontSize(16);
    doc.text("Registro de Paros e Incidencias", 10, 10);
    doc.setFontSize(12);

    const headers = [["#", "Fecha", "Inicio", "Fin", "Duración", "Motivo", "Foto"]];

    const data = eventList.map((event, index) => [
      index + 1,
      event.date,
      event.start,
      event.end,
      event.duration,
      event.reason,
      "" // Celda vacía para la imagen
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      startY: 30,
      margin: { top: 20 },
      styles: {
        cellPadding: 3,
        fontSize: 10,
        valign: "middle",
        halign: "center"
      },
      didDrawCell: (data) => {
        // Solo agrega la imagen en las celdas del cuerpo de la tabla (section === 'body')
        if (data.column.index === 6 && data.section === 'body' && eventList[data.row.index].photo) {
          doc.addImage(
            eventList[data.row.index].photo,
            "JPEG",
            data.cell.x + 2,
            data.cell.y + 2,
            20,
            20
          );
        }
      },
      headStyles: {
        fillColor: [0, 123, 255],
        textColor: 255
      }
    });

    doc.save(`${fileName}.pdf`);
  }

  window.saveAs = function () {
    const fileName = document.getElementById("file-name").value.trim();

    if (!fileName) {
      alert("Por favor, ingresa un nombre para el archivo.");
      return;
    }

    saveAsPDF(fileName);
    closeSaveAsDialog();
  };
});
