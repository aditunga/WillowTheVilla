(() => {
  const STORAGE_KEY = "willow-the-villa-bookings-v1";
  const LANGUAGE_KEY = "willow-the-villa-language";
  const DAY_MS = 24 * 60 * 60 * 1000;

  const SOURCES = [
    {
      id: "airbnb",
      label: "Airbnb",
      className: "airbnb",
      url: "https://airbnb.com/h/willowthevilla",
    },
    { id: "booking", label: "Booking.com", className: "booking" },
    { id: "makemytrip", label: "MakeMyTrip", className: "makemytrip" },
    { id: "direct", label: "Direct", className: "direct" },
  ];

  const STATUS_OPTIONS = [
    { id: "confirmed", te: "ధృవీకరించబడింది", en: "Confirmed" },
    { id: "arriving", te: "ఈరోజు వస్తున్నారు", en: "Arriving today" },
    { id: "staying", te: "ఇక్కడ ఉన్నారు", en: "Staying now" },
    { id: "checkout", te: "ఈరోజు వెళ్తున్నారు", en: "Checking out" },
    { id: "completed", te: "పూర్తి అయింది", en: "Completed" },
    { id: "cancelled", te: "రద్దు అయింది", en: "Cancelled" },
  ];

  const ID_OPTIONS = [
    { id: "pending", te: "మిగిలింది", en: "Pending" },
    { id: "collected", te: "సేకరించబడింది", en: "Collected" },
  ];

  const COPY = {
    te: {
      addEditBooking: "బుకింగ్ జోడించు / సవరించు",
      adults: "పెద్దలు",
      airbnb: "Airbnb",
      arrivalTime: "రాక సమయం",
      booking: "Booking.com",
      bookingId: "బుకింగ్ ఐడి",
      calendar: "క్యాలెండర్",
      call: "కాల్",
      cancelled: "రద్దు అయింది",
      caretaker: "సంరక్షకుల క్యాలెండర్",
      checkIn: "చెక్-ఇన్",
      checkOut: "చెక్-అవుట్",
      children: "పిల్లలు",
      clearForm: "క్లియర్",
      clearSelection: "సెలెక్షన్ క్లియర్",
      combined: "Airbnb, Booking.com, MakeMyTrip",
      confirmDelete: "ఈ బుకింగ్ తొలగించాలా?",
      dateRange: "తేదీలు",
      delete: "తొలగించు",
      direct: "Direct",
      edit: "సవరించు",
      email: "ఈమెయిల్",
      emptyDate: "ఈ తేదీకి బుకింగ్‌లు లేవు",
      exportDone: "CSV డౌన్‌లోడ్ అయింది",
      guestName: "అతిథి పేరు",
      guests: "అతిథులు",
      idProof: "ఐడీ ప్రూఫ్",
      invalidDates: "చెక్-అవుట్ తేదీ చెక్-ఇన్ తర్వాత ఉండాలి",
      makemytrip: "MakeMyTrip",
      notes: "కేర్‌టేకర్ నోట్లు",
      nights: "రాత్రులు",
      noValue: "లేదా",
      phone: "ఫోన్ నంబర్",
      platform: "ఎక్కడ బుక్ అయింది",
      requests: "అభ్యర్థనలు",
      saveBooking: "సేవ్",
      saved: "బుకింగ్ సేవ్ అయింది",
      selectedDate: "ఎంచుకున్న తేదీ",
      source: "మూలం",
      status: "స్థితి",
      title: "ఒకే క్యాలెండర్‌లో అన్ని బుకింగ్‌లు",
      today: "ఈరోజు",
      vehicle: "వాహనం నంబర్",
      villaRoom: "విల్లా/గది",
      whatsapp: "వాట్సాప్",
    },
    en: {
      addEditBooking: "Add / Edit Booking",
      adults: "Adults",
      airbnb: "Airbnb",
      arrivalTime: "Arrival time",
      booking: "Booking.com",
      bookingId: "Booking ID",
      calendar: "Calendar",
      call: "Call",
      cancelled: "Cancelled",
      caretaker: "Caretaker calendar",
      checkIn: "Check-in",
      checkOut: "Check-out",
      children: "Children",
      clearForm: "Clear",
      clearSelection: "Clear selection",
      combined: "Airbnb, Booking.com, MakeMyTrip",
      confirmDelete: "Delete this booking?",
      dateRange: "Dates",
      delete: "Delete",
      direct: "Direct",
      edit: "Edit",
      email: "Email",
      emptyDate: "No bookings for this date",
      exportDone: "CSV downloaded",
      guestName: "Guest name",
      guests: "Guests",
      idProof: "ID proof",
      invalidDates: "Check-out must be after check-in",
      makemytrip: "MakeMyTrip",
      notes: "Caretaker notes",
      nights: "nights",
      noValue: "None",
      phone: "Phone number",
      platform: "Booked through",
      requests: "Requests",
      saveBooking: "Save",
      saved: "Booking saved",
      selectedDate: "Selected date",
      source: "Source",
      status: "Status",
      title: "All bookings in one calendar",
      today: "Today",
      vehicle: "Vehicle number",
      villaRoom: "Villa/room",
      whatsapp: "WhatsApp",
    },
  };

  const state = {
    bookings: [],
    currentMonth: startOfMonth(today()),
    lang: localStorage.getItem(LANGUAGE_KEY) || "te",
    selectedDate: toISO(today()),
  };

  const els = {
    bookingForm: document.getElementById("bookingForm"),
    bookingInternalId: document.getElementById("bookingInternalId"),
    bookingStatus: document.getElementById("bookingStatus"),
    calendarTitle: document.getElementById("calendarTitle"),
    clearSelectionButton: document.getElementById("clearSelectionButton"),
    entryCard: document.getElementById("entryCard"),
    exportButton: document.getElementById("exportButton"),
    idProof: document.getElementById("idProof"),
    languageToggle: document.getElementById("languageToggle"),
    monthGrid: document.getElementById("monthGrid"),
    nextMonth: document.getElementById("nextMonth"),
    platform: document.getElementById("platform"),
    prevMonth: document.getElementById("prevMonth"),
    resetButton: document.getElementById("resetButton"),
    selectedBookings: document.getElementById("selectedBookings"),
    selectedCount: document.getElementById("selectedCount"),
    selectedTitle: document.getElementById("selectedTitle"),
    sourceLegend: document.getElementById("sourceLegend"),
    todayButton: document.getElementById("todayButton"),
    weekdayRow: document.getElementById("weekdayRow"),
  };

  init();

  function init() {
    state.bookings = loadBookings();
    populateStaticSelects();
    bindEvents();
    resetForm();
    render();
  }

  function bindEvents() {
    els.prevMonth.addEventListener("click", () => {
      state.currentMonth = new Date(
        state.currentMonth.getFullYear(),
        state.currentMonth.getMonth() - 1,
        1,
      );
      renderCalendar();
    });

    els.nextMonth.addEventListener("click", () => {
      state.currentMonth = new Date(
        state.currentMonth.getFullYear(),
        state.currentMonth.getMonth() + 1,
        1,
      );
      renderCalendar();
    });

    els.todayButton.addEventListener("click", () => {
      state.selectedDate = toISO(today());
      state.currentMonth = startOfMonth(today());
      render();
    });

    els.clearSelectionButton.addEventListener("click", () => {
      state.selectedDate = "";
      render();
    });

    els.languageToggle.addEventListener("click", () => {
      state.lang = state.lang === "te" ? "en" : "te";
      localStorage.setItem(LANGUAGE_KEY, state.lang);
      populateStatusSelects();
      render();
    });

    els.monthGrid.addEventListener("click", (event) => {
      const dayButton = event.target.closest("[data-date]");
      if (!dayButton) return;
      state.selectedDate = dayButton.dataset.date;
      state.currentMonth = startOfMonth(parseISO(state.selectedDate));
      resetForm();
      render();
      document.querySelector(".selected-card").scrollIntoView({ block: "start" });
    });

    els.selectedBookings.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]");
      if (!action) return;

      const booking = state.bookings.find((item) => item.id === action.dataset.id);
      if (!booking) return;

      if (action.dataset.action === "edit") {
        fillForm(booking);
        els.entryCard.open = true;
        els.entryCard.scrollIntoView({ block: "start" });
      }

      if (action.dataset.action === "delete") {
        if (!window.confirm(t("confirmDelete"))) return;
        state.bookings = state.bookings.filter((item) => item.id !== booking.id);
        saveBookings();
        render();
      }
    });

    els.bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const booking = readForm();
      if (parseISO(booking.checkOut) <= parseISO(booking.checkIn)) {
        toast(t("invalidDates"));
        return;
      }

      if (booking.id) {
        state.bookings = state.bookings.map((item) =>
          item.id === booking.id ? booking : item,
        );
      } else {
        booking.id = createId();
        state.bookings.push(booking);
      }

      state.selectedDate = booking.checkIn;
      state.currentMonth = startOfMonth(parseISO(booking.checkIn));
      saveBookings();
      resetForm();
      render();
      toast(t("saved"));
    });

    els.resetButton.addEventListener("click", resetForm);
    els.exportButton.addEventListener("click", exportCsv);
  }

  function render() {
    translatePage();
    renderLegend();
    renderWeekdays();
    renderCalendar();
    renderSelectedDate();
  }

  function translatePage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    els.languageToggle.textContent = state.lang === "te" ? "English" : "తెలుగు";
  }

  function renderLegend() {
    els.sourceLegend.innerHTML = SOURCES.map((source) => {
      const label = escapeHtml(t(source.id));
      return `<span class="legend-item"><span class="source-dot ${source.className}"></span>${label}</span>`;
    }).join("");
  }

  function renderWeekdays() {
    const formatter = new Intl.DateTimeFormat(locale(), { weekday: "short" });
    const sunday = new Date(2026, 1, 1);
    els.weekdayRow.innerHTML = Array.from({ length: 7 }, (_, index) => {
      const label = formatter.format(addDays(sunday, index));
      return `<span>${escapeHtml(label)}</span>`;
    }).join("");
  }

  function renderCalendar() {
    els.calendarTitle.textContent = new Intl.DateTimeFormat(locale(), {
      month: "long",
      year: "numeric",
    }).format(state.currentMonth);

    const firstDay = startOfMonth(state.currentMonth);
    const gridStart = addDays(firstDay, -firstDay.getDay());
    const todayIso = toISO(today());
    const selected = state.selectedDate;
    const month = state.currentMonth.getMonth();

    els.monthGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      const iso = toISO(date);
      const bookings = bookingsForDate(iso);
      const sourceIds = [...new Set(bookings.map((booking) => booking.platform))];
      const sourceBars = sourceIds
        .slice(0, 4)
        .map((sourceId) => {
          const source = getSource(sourceId);
          return `<span class="source-bar ${source.className}"></span>`;
        })
        .join("");
      const more =
        bookings.length > 4
          ? `<span class="more-count">+${bookings.length - 4}</span>`
          : "";
      const classes = [
        "day-cell",
        date.getMonth() !== month ? "outside" : "",
        iso === todayIso ? "today" : "",
        iso === selected ? "selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const ariaLabel = `${formatFullDate(iso)}: ${bookings.length}`;

      return `
        <button class="${classes}" type="button" data-date="${iso}" aria-label="${escapeHtml(ariaLabel)}">
          <span class="day-number">${date.getDate()}</span>
          <span></span>
          <span class="booking-stack">${sourceBars}${more}</span>
        </button>
      `;
    }).join("");
  }

  function renderSelectedDate() {
    if (!state.selectedDate) {
      els.selectedTitle.textContent = t("calendar");
      els.selectedCount.textContent = "0";
      els.selectedBookings.innerHTML = `<div class="empty-state">${escapeHtml(t("emptyDate"))}</div>`;
      return;
    }

    const bookings = bookingsForDate(state.selectedDate);
    els.selectedTitle.textContent = formatFullDate(state.selectedDate);
    els.selectedCount.textContent = String(bookings.length);

    if (!bookings.length) {
      els.selectedBookings.innerHTML = `<div class="empty-state">${escapeHtml(t("emptyDate"))}</div>`;
      return;
    }

    els.selectedBookings.innerHTML = bookings
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.guestName.localeCompare(b.guestName))
      .map(renderGuestCard)
      .join("");
  }

  function renderGuestCard(booking) {
    const source = getSource(booking.platform);
    const phone = booking.phone || "";
    const callHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
    const whatsappHref = whatsappUrl(phone);
    const guestCount = `${booking.adults || 0} ${t("adults")}, ${booking.children || 0} ${t("children")}`;
    const dateText = `${formatShortDate(booking.checkIn)} - ${formatShortDate(booking.checkOut)} (${nights(booking)} ${t("nights")})`;
    const optionalDetails = [
      detail(t("email"), booking.email),
      detail(t("vehicle"), booking.vehicle),
      detail(t("requests"), booking.requests, true),
      detail(t("notes"), booking.notes, true),
    ].join("");

    return `
      <article class="guest-card">
        <div class="guest-top">
          <div class="guest-name">
            <h3>${escapeHtml(booking.guestName)}</h3>
            <p>${escapeHtml(phone)}</p>
          </div>
          <span class="source-chip ${source.className}">${escapeHtml(source.label)}</span>
        </div>

        <div class="detail-grid">
          ${detail(t("dateRange"), dateText)}
          ${detail(t("arrivalTime"), booking.arrivalTime || t("noValue"))}
          ${detail(t("villaRoom"), booking.villaRoom)}
          ${detail(t("guests"), guestCount)}
          ${detail(t("bookingId"), booking.bookingId)}
          ${detail(t("status"), optionLabel(STATUS_OPTIONS, booking.status))}
          ${detail(t("idProof"), optionLabel(ID_OPTIONS, booking.idProof))}
          ${optionalDetails}
        </div>

        <div class="booking-actions">
          <a class="contact-link" href="${escapeAttr(callHref)}">
            <svg><use href="#icon-phone"></use></svg>
            <span>${escapeHtml(t("call"))}</span>
          </a>
          <a class="contact-link" href="${escapeAttr(whatsappHref)}" target="_blank" rel="noreferrer">
            <svg><use href="#icon-message"></use></svg>
            <span>${escapeHtml(t("whatsapp"))}</span>
          </a>
          <button class="ghost-button" type="button" data-action="edit" data-id="${escapeAttr(booking.id)}">
            <svg><use href="#icon-edit"></use></svg>
            <span>${escapeHtml(t("edit"))}</span>
          </button>
          <button class="danger-button" type="button" data-action="delete" data-id="${escapeAttr(booking.id)}">
            <svg><use href="#icon-trash"></use></svg>
            <span>${escapeHtml(t("delete") || "Delete")}</span>
          </button>
        </div>
      </article>
    `;
  }

  function detail(label, value, full = false) {
    const display = value || t("noValue");
    return `
      <div class="detail ${full ? "full" : ""}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(display)}</strong>
      </div>
    `;
  }

  function populateStaticSelects() {
    els.platform.innerHTML = SOURCES.map(
      (source) => `<option value="${source.id}">${escapeHtml(source.label)}</option>`,
    ).join("");
    populateStatusSelects();
  }

  function populateStatusSelects() {
    const statusValue = els.bookingStatus.value || "confirmed";
    const idValue = els.idProof.value || "pending";

    els.bookingStatus.innerHTML = STATUS_OPTIONS.map(
      (option) => `<option value="${option.id}">${escapeHtml(option[state.lang])}</option>`,
    ).join("");
    els.idProof.innerHTML = ID_OPTIONS.map(
      (option) => `<option value="${option.id}">${escapeHtml(option[state.lang])}</option>`,
    ).join("");

    els.bookingStatus.value = statusValue;
    els.idProof.value = idValue;
  }

  function readForm() {
    const form = new FormData(els.bookingForm);
    return {
      id: els.bookingInternalId.value,
      guestName: clean(form.get("guestName")),
      phone: clean(form.get("phone")),
      platform: clean(form.get("platform")),
      bookingId: clean(form.get("bookingId")),
      checkIn: clean(form.get("checkIn")),
      checkOut: clean(form.get("checkOut")),
      arrivalTime: clean(form.get("arrivalTime")),
      villaRoom: clean(form.get("villaRoom")),
      adults: Number(form.get("adults") || 1),
      children: Number(form.get("children") || 0),
      status: clean(form.get("bookingStatus")),
      idProof: clean(form.get("idProof")),
      email: clean(form.get("email")),
      vehicle: clean(form.get("vehicle")),
      requests: clean(form.get("requests")),
      notes: clean(form.get("notes")),
    };
  }

  function fillForm(booking) {
    els.bookingInternalId.value = booking.id;
    setValue("guestName", booking.guestName);
    setValue("phone", booking.phone);
    setValue("platform", booking.platform);
    setValue("bookingId", booking.bookingId);
    setValue("checkIn", booking.checkIn);
    setValue("checkOut", booking.checkOut);
    setValue("arrivalTime", booking.arrivalTime);
    setValue("villaRoom", booking.villaRoom);
    setValue("adults", booking.adults);
    setValue("children", booking.children);
    setValue("bookingStatus", booking.status);
    setValue("idProof", booking.idProof);
    setValue("email", booking.email);
    setValue("vehicle", booking.vehicle);
    setValue("requests", booking.requests);
    setValue("notes", booking.notes);
  }

  function resetForm() {
    els.bookingForm.reset();
    els.bookingInternalId.value = "";
    const base = state.selectedDate || toISO(today());
    setValue("checkIn", base);
    setValue("checkOut", toISO(addDays(parseISO(base), 1)));
    setValue("villaRoom", "Willow Villa");
    setValue("adults", 2);
    setValue("children", 0);
    setValue("platform", "airbnb");
    setValue("bookingStatus", "confirmed");
    setValue("idProof", "pending");
  }

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value ?? "";
  }

  function loadBookings() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    const seeded = seedBookings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function saveBookings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
  }

  function seedBookings() {
    const base = today();
    return [
      {
        id: "sample-airbnb",
        guestName: "Ravi Kumar",
        phone: "+91 98765 43210",
        platform: "airbnb",
        bookingId: "AIR-WTV-1024",
        checkIn: toISO(base),
        checkOut: toISO(addDays(base, 2)),
        arrivalTime: "15:00",
        villaRoom: "Willow Villa",
        adults: 4,
        children: 1,
        status: "arriving",
        idProof: "pending",
        email: "ravi@example.com",
        vehicle: "AP39 AB 1234",
        requests: "Extra towels",
        notes: "Call before arrival",
      },
      {
        id: "sample-booking",
        guestName: "Meera Shah",
        phone: "+91 91234 56780",
        platform: "booking",
        bookingId: "BDC-5521",
        checkIn: toISO(addDays(base, 3)),
        checkOut: toISO(addDays(base, 5)),
        arrivalTime: "13:30",
        villaRoom: "Willow Villa",
        adults: 2,
        children: 0,
        status: "confirmed",
        idProof: "pending",
        email: "meera@example.com",
        vehicle: "",
        requests: "Late lunch",
        notes: "",
      },
      {
        id: "sample-mmt",
        guestName: "Arjun Reddy",
        phone: "+91 99887 76655",
        platform: "makemytrip",
        bookingId: "MMT-88019",
        checkIn: toISO(addDays(base, 8)),
        checkOut: toISO(addDays(base, 10)),
        arrivalTime: "18:00",
        villaRoom: "Willow Villa",
        adults: 3,
        children: 2,
        status: "confirmed",
        idProof: "collected",
        email: "arjun@example.com",
        vehicle: "TS09 CD 7788",
        requests: "Baby cot",
        notes: "Family booking",
      },
    ];
  }

  function bookingsForDate(isoDate) {
    return state.bookings.filter((booking) => {
      if (booking.status === "cancelled") return false;
      return booking.checkIn <= isoDate && isoDate <= booking.checkOut;
    });
  }

  function getSource(id) {
    return SOURCES.find((source) => source.id === id) || SOURCES[SOURCES.length - 1];
  }

  function optionLabel(options, id) {
    const option = options.find((item) => item.id === id);
    return option ? option[state.lang] : id || t("noValue");
  }

  function exportCsv() {
    const columns = [
      ["guestName", t("guestName")],
      ["phone", t("phone")],
      ["platform", t("platform")],
      ["bookingId", t("bookingId")],
      ["checkIn", t("checkIn")],
      ["checkOut", t("checkOut")],
      ["arrivalTime", t("arrivalTime")],
      ["villaRoom", t("villaRoom")],
      ["adults", t("adults")],
      ["children", t("children")],
      ["status", t("status")],
      ["idProof", t("idProof")],
      ["email", t("email")],
      ["vehicle", t("vehicle")],
      ["requests", t("requests")],
      ["notes", t("notes")],
    ];
    const rows = [
      columns.map(([, label]) => label),
      ...state.bookings.map((booking) =>
        columns.map(([key]) => {
          if (key === "platform") return getSource(booking.platform).label;
          if (key === "status") return optionLabel(STATUS_OPTIONS, booking.status);
          if (key === "idProof") return optionLabel(ID_OPTIONS, booking.idProof);
          return booking[key] ?? "";
        }),
      ),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `willow-bookings-${toISO(today())}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast(t("exportDone"));
  }

  function toast(message) {
    const element = document.createElement("div");
    element.className = "toast";
    element.textContent = message;
    document.body.append(element);
    requestAnimationFrame(() => element.classList.add("show"));
    window.setTimeout(() => {
      element.classList.remove("show");
      window.setTimeout(() => element.remove(), 220);
    }, 2200);
  }

  function t(key) {
    return COPY[state.lang][key] || COPY.en[key] || key;
  }

  function locale() {
    return state.lang === "te" ? "te-IN" : "en-IN";
  }

  function today() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function parseISO(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function toISO(date) {
    const localDate = new Date(date);
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    return localDate.toISOString().slice(0, 10);
  }

  function formatFullDate(value) {
    return new Intl.DateTimeFormat(locale(), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parseISO(value));
  }

  function formatShortDate(value) {
    return new Intl.DateTimeFormat(locale(), {
      day: "2-digit",
      month: "short",
    }).format(parseISO(value));
  }

  function nights(booking) {
    return Math.max(1, Math.round((parseISO(booking.checkOut) - parseISO(booking.checkIn)) / DAY_MS));
  }

  function whatsappUrl(phone) {
    const digits = phone.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "#";
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `booking-${Date.now()}-${Math.round(Math.random() * 100000)}`;
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
})();
