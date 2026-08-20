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
      importBookings: "బుకింగ్‌లు ఇంపోర్ట్ చేయి",
      importDone: "ఇంపోర్ట్ పూర్తయింది",
      importFile: "CSV / ICS ఫైల్",
      importInvalid: "సరైన CSV లేదా ICS ఫైల్ ఎంచుకోండి",
      importSource: "ఇంపోర్ట్ మూలం",
      invalidDates: "చెక్-అవుట్ తేదీ చెక్-ఇన్ తర్వాత ఉండాలి",
      makemytrip: "MakeMyTrip",
      notes: "కేర్‌టేకర్ నోట్లు",
      nights: "రాత్రులు",
      noValue: "లేదు",
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
      importBookings: "Import bookings",
      importDone: "Import complete",
      importFile: "CSV / ICS file",
      importInvalid: "Choose a valid CSV or ICS file",
      importSource: "Import source",
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
    importButton: document.getElementById("importButton"),
    importFile: document.getElementById("importFile"),
    importSource: document.getElementById("importSource"),
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
    els.importButton.addEventListener("click", importSelectedFile);
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
    const sourceOptions = SOURCES.map(
      (source) => `<option value="${source.id}">${escapeHtml(source.label)}</option>`,
    ).join("");
    els.platform.innerHTML = sourceOptions;
    els.importSource.innerHTML = sourceOptions;
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
    return [];
  }

  function saveBookings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
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

  async function importSelectedFile() {
    const file = els.importFile.files?.[0];
    if (!file) {
      toast(t("importInvalid"));
      return;
    }

    const text = await file.text();
    const fallbackSource = els.importSource.value || "direct";
    const lowerName = file.name.toLowerCase();
    const imported =
      lowerName.endsWith(".ics") || text.includes("BEGIN:VCALENDAR")
        ? parseIcsBookings(text, fallbackSource)
        : parseCsvBookings(text, fallbackSource);

    if (!imported.length) {
      toast(t("importInvalid"));
      return;
    }

    const result = mergeBookings(imported);
    state.selectedDate = imported[0].checkIn;
    state.currentMonth = startOfMonth(parseISO(state.selectedDate));
    saveBookings();
    render();
    toast(`${t("importDone")} (${result.added + result.updated})`);
  }

  function parseCsvBookings(text, fallbackSource) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => fieldForHeader(header));
    return rows
      .slice(1)
      .map((row) => {
        const raw = {};
        headers.forEach((field, index) => {
          if (field) raw[field] = clean(row[index]);
        });

        const source = sourceFromValue(raw.platform) || fallbackSource;
        const checkIn = normalizeImportedDate(raw.checkIn);
        const checkOut = normalizeImportedDate(raw.checkOut);
        if (!checkIn || !checkOut) return null;

        return normalizeBooking({
          id: "",
          guestName: raw.guestName || `${getSource(source).label} booking`,
          phone: raw.phone,
          platform: source,
          bookingId: raw.bookingId,
          checkIn,
          checkOut,
          arrivalTime: raw.arrivalTime,
          villaRoom: raw.villaRoom || "Willow Villa",
          adults: Number(raw.adults || 1),
          children: Number(raw.children || 0),
          status: normalizeStatus(raw.status),
          idProof: normalizeIdProof(raw.idProof),
          email: raw.email,
          vehicle: raw.vehicle,
          requests: raw.requests,
          notes: raw.notes,
        });
      })
      .filter(Boolean);
  }

  function parseIcsBookings(text, fallbackSource) {
    const source = fallbackSource || "direct";
    const unfolded = text.replace(/\r?\n[ \t]/g, "");
    const events = unfolded.split(/BEGIN:VEVENT/i).slice(1);

    return events
      .map((eventText) => {
        const eventBody = eventText.split(/END:VEVENT/i)[0];
        const summary = icsText(getIcsProperty(eventBody, "SUMMARY"));
        const description = icsText(getIcsProperty(eventBody, "DESCRIPTION"));
        const uid = clean(getIcsProperty(eventBody, "UID"));
        const checkIn = parseIcsDate(getIcsProperty(eventBody, "DTSTART"));
        const rawCheckOut = parseIcsDate(getIcsProperty(eventBody, "DTEND"));
        const phone = extractPhone(`${summary}\n${description}`);

        if (!checkIn) return null;
        const checkOut =
          rawCheckOut && rawCheckOut > checkIn
            ? rawCheckOut
            : toISO(addDays(parseISO(checkIn), 1));

        return normalizeBooking({
          id: "",
          guestName: summary || `${getSource(source).label} booking`,
          phone,
          platform: source,
          bookingId: uid,
          checkIn,
          checkOut,
          arrivalTime: "",
          villaRoom: "Willow Villa",
          adults: 1,
          children: 0,
          status: "confirmed",
          idProof: "pending",
          email: extractEmail(description),
          vehicle: "",
          requests: "",
          notes: description,
        });
      })
      .filter(Boolean);
  }

  function mergeBookings(imported) {
    let added = 0;
    let updated = 0;

    imported.forEach((booking) => {
      const existingIndex = findExistingBookingIndex(booking);
      if (existingIndex >= 0) {
        const existing = state.bookings[existingIndex];
        state.bookings[existingIndex] = { ...existing, ...booking, id: existing.id };
        updated += 1;
        return;
      }

      state.bookings.push({ ...booking, id: createId() });
      added += 1;
    });

    return { added, updated };
  }

  function findExistingBookingIndex(booking) {
    if (booking.bookingId) {
      const index = state.bookings.findIndex(
        (item) =>
          item.platform === booking.platform &&
          item.bookingId &&
          item.bookingId === booking.bookingId,
      );
      if (index >= 0) return index;
    }

    return state.bookings.findIndex(
      (item) =>
        item.platform === booking.platform &&
        item.guestName === booking.guestName &&
        item.checkIn === booking.checkIn &&
        item.checkOut === booking.checkOut,
    );
  }

  function normalizeBooking(booking) {
    const checkIn = booking.checkIn;
    const checkOut =
      booking.checkOut && booking.checkOut > checkIn
        ? booking.checkOut
        : toISO(addDays(parseISO(checkIn), 1));

    return {
      ...booking,
      checkOut,
      adults: Number.isFinite(booking.adults) && booking.adults > 0 ? booking.adults : 1,
      children:
        Number.isFinite(booking.children) && booking.children >= 0 ? booking.children : 0,
      status: booking.status || "confirmed",
      idProof: booking.idProof || "pending",
    };
  }

  function parseCsvRows(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    const source = text.replace(/^\uFEFF/, "");

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      const next = source[index + 1];

      if (quoted) {
        if (char === '"' && next === '"') {
          value += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          value += char;
        }
        continue;
      }

      if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        row.push(value);
        value = "";
      } else if (char === "\n") {
        row.push(value);
        rows.push(row);
        row = [];
        value = "";
      } else if (char !== "\r") {
        value += char;
      }
    }

    row.push(value);
    if (row.some((cell) => clean(cell))) rows.push(row);
    return rows;
  }

  function fieldForHeader(header) {
    const normalized = normalizeToken(header);
    const aliases = {
      guestName: ["guestname", "guest", "name", "customername", "customer"],
      phone: ["phone", "phonenumber", "mobile", "mobilenumber", "contact", "contactnumber"],
      platform: ["platform", "source", "bookedthrough", "bookingplatform"],
      bookingId: ["bookingid", "reservationid", "confirmationnumber", "confirmationcode"],
      checkIn: ["checkin", "checkindate", "arrival", "arrivaldate"],
      checkOut: ["checkout", "checkoutdate", "departure", "departuredate"],
      arrivalTime: ["arrivaltime", "checkintime"],
      villaRoom: ["villaroom", "villa", "room", "unit", "listing"],
      adults: ["adults", "adult"],
      children: ["children", "child", "kids"],
      status: ["status", "bookingstatus"],
      idProof: ["idproof", "idstatus", "identityproof"],
      email: ["email", "emailaddress"],
      vehicle: ["vehicle", "vehiclenumber", "carnumber"],
      requests: ["requests", "specialrequests"],
      notes: ["notes", "caretakernotes", "description"],
    };

    Object.keys(aliases).forEach((field) => {
      aliases[field].push(normalizeToken(field), normalizeToken(COPY.en[field]), normalizeToken(COPY.te[field]));
    });

    return Object.entries(aliases).find(([, values]) => values.includes(normalized))?.[0] || "";
  }

  function getIcsProperty(eventBody, name) {
    const upperName = name.toUpperCase();
    const line = eventBody.split(/\r?\n/).find((item) => {
      const separator = item.indexOf(":");
      if (separator < 0) return false;
      return item.slice(0, separator).split(";")[0].toUpperCase() === upperName;
    });

    if (!line) return "";
    const separator = line.indexOf(":");
    return separator >= 0 ? line.slice(separator + 1) : "";
  }

  function parseIcsDate(value) {
    const match = clean(value).match(/^(\d{4})(\d{2})(\d{2})/);
    if (!match) return "";
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  function icsText(value) {
    return clean(value)
      .replace(/\\n/g, "\n")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\");
  }

  function sourceFromValue(value) {
    const normalized = normalizeToken(value);
    return SOURCES.find(
      (source) =>
        normalizeToken(source.id) === normalized || normalizeToken(source.label) === normalized,
    )?.id;
  }

  function normalizeStatus(value) {
    const normalized = normalizeToken(value);
    return (
      STATUS_OPTIONS.find(
        (option) =>
          normalizeToken(option.id) === normalized ||
          normalizeToken(option.en) === normalized ||
          normalizeToken(option.te) === normalized,
      )?.id || "confirmed"
    );
  }

  function normalizeIdProof(value) {
    const normalized = normalizeToken(value);
    return (
      ID_OPTIONS.find(
        (option) =>
          normalizeToken(option.id) === normalized ||
          normalizeToken(option.en) === normalized ||
          normalizeToken(option.te) === normalized,
      )?.id || "pending"
    );
  }

  function normalizeImportedDate(value) {
    const text = clean(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? "" : toISO(parsed);
  }

  function extractPhone(value) {
    return clean(value.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]);
  }

  function extractEmail(value) {
    return clean(value.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/)?.[0]);
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

  function normalizeToken(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\u0C00-\u0C7F]/g, "");
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
