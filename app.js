(() => {
  const STORAGE_KEY = "willow-the-villa-bookings-v1";
  const LANGUAGE_KEY = "willow-the-villa-language";
  const OWNER_SESSION_KEY = "willow-the-villa-owner-session";
  const OWNER_PANEL_KEY = "willow-the-villa-open-owner-panel";
  const ADMIN_USERNAME = "Venu";
  const ADMIN_PASSWORD_HASH = 862899077;
  const DEFAULT_CHECK_IN_TIME = "14:00";
  const DEFAULT_CHECKOUT_TIME = "11:00";
  const DAY_MS = 24 * 60 * 60 * 1000;
  const REMOTE_TIMEOUT_MS = 4500;
  const REFRESH_INTERVAL_MS = 2 * 60 * 1000;
  // Legacy build, because caretaker phones are not always on a current Safari.
  const PDF_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.min.mjs";
  const PDF_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs";
  // SheetJS ships current builds from its own CDN; the npm copy stopped at 0.18.5.
  const EXCEL_LIBRARY_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
  const MAX_PDF_STAY_NIGHTS = 180;
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let eventsBound = false;

  const storage = createStorage();

  function createStorage() {
    let backend = null;
    try {
      const probe = "willow-storage-probe";
      window.localStorage.setItem(probe, probe);
      window.localStorage.removeItem(probe);
      backend = window.localStorage;
    } catch {
      backend = null;
    }

    const memory = new Map();
    return {
      available: Boolean(backend),
      get(key) {
        if (!backend) return memory.has(key) ? memory.get(key) : null;
        try {
          return backend.getItem(key);
        } catch {
          return null;
        }
      },
      set(key, value) {
        memory.set(key, value);
        if (!backend) return;
        try {
          backend.setItem(key, value);
        } catch (error) {
          console.warn("Willow local storage write failed", error);
        }
      },
      remove(key) {
        memory.delete(key);
        if (!backend) return;
        try {
          backend.removeItem(key);
        } catch {
          /* ignore */
        }
      },
    };
  }

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
      addEditBooking: "త్వరగా బుకింగ్ జోడించు",
      advancedDetails: "మరిన్ని వివరాలు",
      adults: "పెద్దలు",
      admin: "అడ్మిన్",
      adminLogin: "అడ్మిన్ లాగిన్",
      adminLoginError: "యూజర్ పేరు లేదా పాస్‌వర్డ్ తప్పు",
      adminPassword: "పాస్‌వర్డ్",
      adminEmailMissing: "Supabase adminEmail సెట్ చేయాలి",
      adminRequired: "బుకింగ్ మార్చడానికి అడ్మిన్ లాగిన్ అవసరం",
      adminRoleMissing: "ఈ యూజర్‌కు ఓనర్ అనుమతి లేదు",
      adminUsername: "యూజర్ పేరు",
      amountPaid: "చెల్లించిన మొత్తం",
      arrivalTime: "రాక సమయం",
      bookingId: "బుకింగ్ ఐడి",
      bookedNights: "బుక్ అయిన రాత్రులు",
      calendar: "క్యాలెండర్",
      call: "కాల్",
      caretaker: "సంరక్షకుల క్యాలెండర్",
      checkIn: "చెక్-ఇన్",
      checkInTime: "చెక్-ఇన్ సమయం",
      checkOut: "చెక్-అవుట్",
      checkoutTime: "చెక్-అవుట్ సమయం",
      children: "పిల్లలు",
      clearForm: "క్లియర్",
      clearSelection: "సెలెక్షన్ క్లియర్",
      close: "మూసివేయి",
      confirmDelete: "ఈ బుకింగ్ తొలగించాలా?",
      dateRange: "తేదీలు",
      delete: "తొలగించు",
      edit: "సవరించు",
      email: "ఈమెయిల్",
      emptyDate: "ఈ తేదీకి బుకింగ్‌లు లేవు",
      emptyLoaded: "ఇంకా బుకింగ్‌లు లోడ్ కాలేదు",
      emptyLoadedHelp:
        "అడ్మిన్ లాగిన్ చేసి CSV / ICS ఫైల్ ఇంపోర్ట్ చేయండి లేదా కొత్త బుకింగ్ జోడించండి.",
      exportDone: "CSV డౌన్‌లోడ్ అయింది",
      guestName: "అతిథి పేరు",
      guests: "అతిథులు",
      idProof: "ఐడీ ప్రూఫ్",
      importBookings: "బుకింగ్‌లు ఇంపోర్ట్ చేయి",
      importDone: "ఇంపోర్ట్ పూర్తయింది",
      importFile: "CSV / Excel / ICS / PDF ఫైల్",
      importInvalid: "సరైన CSV, Excel, ICS లేదా PDF ఫైల్ ఎంచుకోండి",
      importShort: "ఇంపోర్ట్",
      importSource: "ఇంపోర్ట్ మూలం",
      invalidDates: "చెక్-అవుట్ తేదీ చెక్-ఇన్ తర్వాత ఉండాలి",
      averageBooking: "సగటు బుకింగ్",
      confirmedRevenue: "కన్ఫర్మ్డ్ ఆదాయం",
      logout: "లాగౌట్",
      notes: "కేర్‌టేకర్ నోట్లు",
      nights: "రాత్రులు",
      noValue: "లేదు",
      noteTeluguPreview: "తెలుగు నోట్",
      ownerView: "ఓనర్ వ్యూ",
      pets: "పెంపుడు జంతువులు",
      phone: "ఫోన్ నంబర్ (అవసరం లేదు)",
      excelUnreadable: "Excel ఫైల్ చదవలేకపోయాం. ఇంటర్నెట్ ఉందో చూడండి.",
      pdfNoBooking: "PDF లో బుకింగ్ వివరాలు దొరకలేదు",
      pdfStatement: "ఇది ఎర్నింగ్స్ రిపోర్ట్, బుకింగ్ కన్ఫర్మేషన్ కాదు. బుకింగ్ హిస్టరీ కోసం Airbnb ట్రాన్సాక్షన్ CSV వాడండి.",
      pdfReview: "PDF నుండి వివరాలు నింపాం — చెక్ చేసి సేవ్ చేయండి",
      pdfUnreadable: "PDF చదవలేకపోయాం. ఇంటర్నెట్ ఉందో చూడండి.",
      phonePending: "ఫోన్ నంబర్ అప్డేట్ చేయాలి",
      phonePlaceholder: "నంబర్ లేకపోతే ఖాళీగా వదిలేయండి",
      platform: "ఎక్కడ బుక్ అయింది",
      quickAdd: "జోడించు",
      requests: "అభ్యర్థనలు",
      saveBooking: "సేవ్",
      saved: "బుకింగ్ సేవ్ అయింది",
      selectedDate: "ఎంచుకున్న తేదీ",
      status: "స్థితి",
      syncFailed: "క్లౌడ్ సేవ్ కాలేదు. మళ్లీ ప్రయత్నించండి.",
      today: "ఈరోజు",
      totalBookings: "మొత్తం బుకింగ్‌లు",
      totalRevenue: "మొత్తం ఆదాయం",
      vehicle: "వాహనం నంబర్",
      villaRoom: "విల్లా/గది",
      bookingWord: "బుకింగ్",
      bookingsWord: "బుకింగ్‌లు",
      overlapConfirm: "అయినా సేవ్ చేయాలా?",
      overlapTitle: "ఈ తేదీలు ఇప్పటికే బుక్ అయ్యాయి",
      searchLabel: "వెతకండి",
      searchNoResults: "ఫలితాలు లేవు",
      searchPlaceholder: "అతిథి పేరు, ఫోన్ లేదా బుకింగ్ ఐడి",
      syncLocalOnly: "ఈ ఫోన్‌లో మాత్రమే సేవ్",
      syncNotSetUp: "క్లౌడ్ ఇంకా సెటప్ కాలేదు",
      syncOffline: "ఆఫ్‌లైన్ — సేవ్ చేసిన కాపీ",
      syncRefresh: "రిఫ్రెష్",
      syncUpdated: "అప్‌డేట్",
      syncing: "సింక్ అవుతోంది…",
      whatsapp: "వాట్సాప్",
    },
    en: {
      addEditBooking: "Quick add booking",
      advancedDetails: "More details",
      adults: "Adults",
      admin: "Admin",
      adminLogin: "Admin login",
      adminLoginError: "Wrong username or password",
      adminPassword: "Password",
      adminEmailMissing: "Set adminEmail in supabase-config.js",
      adminRequired: "Admin login is required to change bookings",
      adminRoleMissing: "This user is not allowed as owner",
      adminUsername: "Username",
      amountPaid: "Amount paid",
      arrivalTime: "Arrival time",
      bookingId: "Booking ID",
      bookedNights: "Booked nights",
      calendar: "Calendar",
      call: "Call",
      caretaker: "Caretaker calendar",
      checkIn: "Check-in",
      checkInTime: "Check-in time",
      checkOut: "Check-out",
      checkoutTime: "Checkout time",
      children: "Children",
      clearForm: "Clear",
      clearSelection: "Clear selection",
      close: "Close",
      confirmDelete: "Delete this booking?",
      dateRange: "Dates",
      delete: "Delete",
      edit: "Edit",
      email: "Email",
      emptyDate: "No bookings for this date",
      emptyLoaded: "No bookings loaded yet",
      emptyLoadedHelp:
        "Admin can import a CSV / ICS file or add a booking.",
      exportDone: "CSV downloaded",
      guestName: "Guest name",
      guests: "Guests",
      idProof: "ID proof",
      importBookings: "Import bookings",
      importDone: "Import complete",
      importFile: "CSV / Excel / ICS / PDF file",
      importInvalid: "Choose a valid CSV, Excel, ICS or PDF file",
      importShort: "Import",
      importSource: "Import source",
      invalidDates: "Check-out must be after check-in",
      averageBooking: "Average booking",
      confirmedRevenue: "Confirmed revenue",
      logout: "Logout",
      notes: "Caretaker notes",
      nights: "nights",
      noValue: "None",
      noteTeluguPreview: "Telugu note",
      ownerView: "Owner view",
      pets: "Pets",
      phone: "Phone number (optional)",
      excelUnreadable: "Could not read that Excel file. Check the internet connection.",
      pdfNoBooking: "No booking details found in that PDF",
      pdfStatement: "That is an earnings report, not a booking confirmation. Use the Airbnb transaction CSV for booking history.",
      pdfReview: "Filled from the PDF — check the details and save",
      pdfUnreadable: "Could not read that PDF. Check the internet connection.",
      phonePending: "Phone number to be updated",
      phonePlaceholder: "Leave blank if unavailable",
      platform: "Booked through",
      quickAdd: "Add",
      requests: "Requests",
      saveBooking: "Save",
      saved: "Booking saved",
      selectedDate: "Selected date",
      status: "Status",
      syncFailed: "Cloud save failed. Try again.",
      today: "Today",
      totalBookings: "Total bookings",
      totalRevenue: "Total revenue",
      vehicle: "Vehicle number",
      villaRoom: "Villa/room",
      bookingWord: "booking",
      bookingsWord: "bookings",
      overlapConfirm: "Save anyway?",
      overlapTitle: "These dates overlap another booking",
      searchLabel: "Search",
      searchNoResults: "No matches",
      searchPlaceholder: "Guest name, phone or booking ID",
      syncLocalOnly: "Saved on this device",
      syncNotSetUp: "Cloud storage is not set up yet",
      syncOffline: "Offline — showing saved copy",
      syncRefresh: "Refresh",
      syncUpdated: "Updated",
      syncing: "Syncing…",
      whatsapp: "WhatsApp",
    },
  };

  const storedLang = storage.get(LANGUAGE_KEY);

  const state = {
    bookings: [],
    currentMonth: startOfMonth(today()),
    isAdmin: false,
    isSyncing: false,
    lang: COPY[storedLang] ? storedLang : "te",
    lastSyncedAt: 0,
    remoteClient: null,
    remoteConfig: null,
    remoteError: "",
    remoteNeedsSetup: false,
    searchTerm: "",
    selectedDate: toISO(today()),
  };

  const modalStack = [];

  const els = {
    adminAddBooking: document.getElementById("adminAddBooking"),
    adminButton: document.getElementById("adminButton"),
    adminButtonLabel: document.getElementById("adminButtonLabel"),
    adminExportCsv: document.getElementById("adminExportCsv"),
    adminImportBookings: document.getElementById("adminImportBookings"),
    adminLoginError: document.getElementById("adminLoginError"),
    adminLoginForm: document.getElementById("adminLoginForm"),
    adminLoginModal: document.getElementById("adminLoginModal"),
    adminLogout: document.getElementById("adminLogout"),
    adminPanelModal: document.getElementById("adminPanelModal"),
    adminPassword: document.getElementById("adminPassword"),
    adminUsername: document.getElementById("adminUsername"),
    bookingForm: document.getElementById("bookingForm"),
    bookingInternalId: document.getElementById("bookingInternalId"),
    bookingModal: document.getElementById("bookingModal"),
    bookingStatus: document.getElementById("bookingStatus"),
    calendarTitle: document.getElementById("calendarTitle"),
    closeAdminLogin: document.getElementById("closeAdminLogin"),
    closeAdminPanel: document.getElementById("closeAdminPanel"),
    closeBookingModal: document.getElementById("closeBookingModal"),
    closeFormModal: document.getElementById("closeFormModal"),
    closeImportModal: document.getElementById("closeImportModal"),
    clearSelectionButton: document.getElementById("clearSelectionButton"),
    formModal: document.getElementById("formModal"),
    guestName: document.getElementById("guestName"),
    idProof: document.getElementById("idProof"),
    importButton: document.getElementById("importButton"),
    importFile: document.getElementById("importFile"),
    importModal: document.getElementById("importModal"),
    importSource: document.getElementById("importSource"),
    languageToggle: document.getElementById("languageToggle"),
    financeAverage: document.getElementById("financeAverage"),
    financeBookings: document.getElementById("financeBookings"),
    financeConfirmed: document.getElementById("financeConfirmed"),
    financeNights: document.getElementById("financeNights"),
    financeTotal: document.getElementById("financeTotal"),
    monthGrid: document.getElementById("monthGrid"),
    nextMonth: document.getElementById("nextMonth"),
    notePreview: document.getElementById("notePreview"),
    notes: document.getElementById("notes"),
    platform: document.getElementById("platform"),
    prevMonth: document.getElementById("prevMonth"),
    refreshButton: document.getElementById("refreshButton"),
    resetButton: document.getElementById("resetButton"),
    searchInput: document.getElementById("searchInput"),
    searchResults: document.getElementById("searchResults"),
    selectedBookings: document.getElementById("selectedBookings"),
    selectedCount: document.getElementById("selectedCount"),
    selectedTitle: document.getElementById("selectedTitle"),
    syncStatus: document.getElementById("syncStatus"),
    todayButton: document.getElementById("todayButton"),
    weekdayRow: document.getElementById("weekdayRow"),
  };

  init();

  async function init() {
    state.bookings = loadLocalBookings();
    state.remoteConfig = getSupabaseConfig();
    // Local-only mode has nothing to verify against, so the marker is enough.
    if (!state.remoteConfig && hadOwnerSession()) state.isAdmin = true;
    populateStaticSelects();
    bindEvents();
    resetForm();
    render();
    registerServiceWorker();
    if (state.isAdmin && takePendingOwnerPanel()) openAdminPanel();

    hydrateRemote().catch((error) => {
      state.remoteError = error.message || String(error);
      console.warn("Willow cloud startup failed", error);
      renderSyncStatus();
    });
    startAutoRefresh();
  }

  function registerServiceWorker() {
    if (!window.location.protocol.startsWith("http")) return;
    navigator.serviceWorker?.register("sw.js").catch((error) => {
      console.warn("Willow offline cache unavailable", error);
    });
  }

  function startAutoRefresh() {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshFromCloud();
    });
    window.addEventListener("online", () => refreshFromCloud());
    window.setInterval(() => {
      if (!document.hidden) refreshFromCloud();
    }, REFRESH_INTERVAL_MS);
  }

  async function refreshFromCloud({ force = false } = {}) {
    if (!state.remoteClient || state.isSyncing) return;
    // Never pull the ground out from under an open edit or import.
    if (!force && (!els.formModal.hidden || !els.importModal.hidden)) return;

    state.isSyncing = true;
    renderSyncStatus();
    try {
      state.bookings = await loadBookings();
    } finally {
      state.isSyncing = false;
    }
    render();
  }

  function bindEvents() {
    if (eventsBound) return;
    eventsBound = true;
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
      closeBookingModal();
    });

    els.languageToggle.addEventListener("click", () => {
      state.lang = state.lang === "te" ? "en" : "te";
      storage.set(LANGUAGE_KEY, state.lang);
      populateStatusSelects();
      render();
    });

    els.monthGrid.addEventListener("click", (event) => {
      const dayButton = event.target.closest("[data-date]");
      if (dayButton) goToDate(dayButton.dataset.date);
    });

    els.selectedBookings.addEventListener("click", async (event) => {
      const action = event.target.closest("[data-action]");
      if (!action) return;
      if (!state.isAdmin) {
        openAdminLogin();
        toast(t("adminRequired"));
        return;
      }

      const booking = state.bookings.find((item) => item.id === action.dataset.id);
      if (!booking) return;

      if (action.dataset.action === "edit") {
        closeBookingModal();
        fillForm(booking);
        openFormModal();
      }

      if (action.dataset.action === "delete") {
        if (!window.confirm(t("confirmDelete"))) return;
        try {
          await deleteRemoteBooking(booking.id);
        } catch {
          return;
        }
        state.bookings = state.bookings.filter((item) => item.id !== booking.id);
        await saveBookings({ syncRemote: false });
        render();
      }
    });

    els.bookingForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.isAdmin) {
        openAdminLogin();
        toast(t("adminRequired"));
        return;
      }
      const draft = readForm();
      if (!draft.checkIn || !draft.checkOut || parseISO(draft.checkOut) <= parseISO(draft.checkIn)) {
        toast(t("invalidDates"));
        return;
      }

      let booking;
      try {
        booking = normalizeBooking(draft);
      } catch {
        toast(t("invalidDates"));
        return;
      }

      const clashes = overlappingBookings(booking);
      if (clashes.length) {
        const summary = clashes
          .map(
            (item) =>
              `• ${item.guestName} (${formatShortDate(item.checkIn)} – ${formatShortDate(item.checkOut)})`,
          )
          .join("\n");
        if (!window.confirm(`${t("overlapTitle")}:\n\n${summary}\n\n${t("overlapConfirm")}`)) return;
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
      await saveBookings();
      resetForm();
      render();
      closeFormModal();
      toast(t("saved"));
    });

    els.resetButton.addEventListener("click", resetForm);
    els.importButton.addEventListener("click", importSelectedFile);
    els.notes.addEventListener("input", renderNotePreview);
    els.refreshButton.addEventListener("click", () => refreshFromCloud({ force: true }));

    els.monthGrid.addEventListener("keydown", (event) => {
      const cell = event.target.closest("[data-date]");
      if (!cell) return;
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (!step) return;
      event.preventDefault();
      focusDate(toISO(addDays(parseISO(cell.dataset.date), step)));
    });

    els.searchInput.addEventListener("input", () => {
      state.searchTerm = els.searchInput.value;
      renderSearchResults();
    });

    els.searchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      clearSearch();
    });

    els.searchResults.addEventListener("click", (event) => {
      const hit = event.target.closest("[data-goto]");
      if (!hit) return;
      goToDate(hit.dataset.goto);
      clearSearch();
    });

    document.addEventListener("click", (event) => {
      if (els.searchResults.hidden) return;
      if (event.target.closest(".calendar-search")) return;
      els.searchResults.hidden = true;
    });

    els.adminButton.addEventListener("click", () => {
      if (state.isAdmin) {
        openAdminPanel();
        return;
      }
      openAdminLogin();
    });
    els.adminLoginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = clean(els.adminUsername.value);
      const password = clean(els.adminPassword.value);
      if (state.remoteClient) {
        try {
          await signInRemoteAdmin(username, password);
          closeAdminLogin();
        } catch (error) {
          els.adminLoginError.textContent = error.message || t("adminLoginError");
          els.adminLoginError.hidden = false;
          els.adminPassword.select();
        }
        return;
      }
      if (username === ADMIN_USERNAME && credentialHash(password) === ADMIN_PASSWORD_HASH) {
        rememberOwnerSession(true);
        setAdminMode(true);
        closeAdminLogin();
        reloadPage();
        return;
      }
      els.adminLoginError.hidden = false;
      els.adminPassword.select();
    });
    els.adminUsername.addEventListener("input", () => {
      els.adminLoginError.hidden = true;
    });
    els.adminPassword.addEventListener("input", () => {
      els.adminLoginError.hidden = true;
    });
    els.adminAddBooking.addEventListener("click", () => {
      closeAdminPanel();
      resetForm();
      openFormModal();
    });
    els.adminImportBookings.addEventListener("click", () => {
      closeAdminPanel();
      openImportModal();
    });
    els.adminExportCsv.addEventListener("click", exportCsv);
    els.adminLogout.addEventListener("click", async () => {
      await signOutAdmin();
      closeAdminPanel();
    });
    els.adminLoginModal.addEventListener("click", (event) => {
      if (event.target === els.adminLoginModal) closeAdminLogin();
    });
    els.adminPanelModal.addEventListener("click", (event) => {
      if (event.target === els.adminPanelModal) closeAdminPanel();
    });
    els.bookingModal.addEventListener("click", (event) => {
      if (event.target === els.bookingModal) closeBookingModal();
    });
    els.formModal.addEventListener("click", (event) => {
      if (event.target === els.formModal) closeFormModal();
    });
    els.importModal.addEventListener("click", (event) => {
      if (event.target === els.importModal) closeImportModal();
    });
    els.closeAdminLogin.addEventListener("click", closeAdminLogin);
    els.closeAdminPanel.addEventListener("click", closeAdminPanel);
    els.closeBookingModal.addEventListener("click", closeBookingModal);
    els.closeFormModal.addEventListener("click", closeFormModal);
    els.closeImportModal.addEventListener("click", closeImportModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        trapTab(event);
        return;
      }
      if (event.key !== "Escape") return;
      const modal = topModal();
      if (!modal) return;
      event.preventDefault();
      closeModal(modal);
    });
  }

  function goToDate(iso) {
    if (!iso) return;
    state.selectedDate = iso;
    state.currentMonth = startOfMonth(parseISO(iso));
    resetForm();
    render();
    openBookingModal();
  }

  function focusDate(iso) {
    const date = parseISO(iso);
    if (
      date.getMonth() !== state.currentMonth.getMonth() ||
      date.getFullYear() !== state.currentMonth.getFullYear()
    ) {
      state.currentMonth = startOfMonth(date);
      renderCalendar();
    }
    els.monthGrid.querySelectorAll("[data-date]").forEach((cell) => {
      cell.tabIndex = cell.dataset.date === iso ? 0 : -1;
    });
    els.monthGrid.querySelector(`[data-date="${iso}"]`)?.focus({ preventScroll: true });
  }

  function clearSearch() {
    state.searchTerm = "";
    els.searchInput.value = "";
    els.searchResults.hidden = true;
    els.searchResults.innerHTML = "";
  }

  function openModal(modal, focusTarget) {
    if (!modal.hidden) return;
    modalStack.push({ modal, opener: document.activeElement });
    modal.hidden = false;
    syncModalLock();
    requestAnimationFrame(() => focusTarget?.focus({ preventScroll: true }));
  }

  function closeModal(modal) {
    const index = modalStack.findIndex((entry) => entry.modal === modal);
    modal.hidden = true;
    syncModalLock();
    if (index < 0) return;
    const [entry] = modalStack.splice(index, 1);
    if (entry.opener?.isConnected) entry.opener.focus({ preventScroll: true });
  }

  function topModal() {
    return modalStack.length ? modalStack[modalStack.length - 1].modal : null;
  }

  function trapTab(event) {
    const modal = topModal();
    if (!modal) return;
    const items = Array.from(modal.querySelectorAll(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null || element === document.activeElement,
    );
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!modal.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function openBookingModal() {
    if (!state.selectedDate) return;
    openModal(els.bookingModal, els.closeBookingModal);
  }

  function closeBookingModal() {
    closeModal(els.bookingModal);
  }

  function openFormModal() {
    if (!state.isAdmin) {
      openAdminLogin();
      toast(t("adminRequired"));
      return;
    }
    openModal(els.formModal, els.guestName);
  }

  function closeFormModal() {
    closeModal(els.formModal);
  }

  function openImportModal() {
    if (!state.isAdmin) {
      openAdminLogin();
      toast(t("adminRequired"));
      return;
    }
    openModal(els.importModal, els.importSource);
  }

  function closeImportModal() {
    closeModal(els.importModal);
  }

  function openAdminLogin() {
    els.adminUsername.value = state.remoteConfig?.adminUsername || ADMIN_USERNAME;
    els.adminPassword.value = "";
    els.adminLoginError.textContent = t("adminLoginError");
    els.adminLoginError.hidden = true;
    openModal(els.adminLoginModal, els.adminPassword);
  }

  function closeAdminLogin() {
    closeModal(els.adminLoginModal);
  }

  function openAdminPanel() {
    renderAdminPanel();
    openModal(els.adminPanelModal, els.closeAdminPanel);
  }

  function closeAdminPanel() {
    closeModal(els.adminPanelModal);
  }

  function setAdminMode(isAdmin) {
    state.isAdmin = isAdmin;
    if (!isAdmin) {
      closeFormModal();
      closeImportModal();
      // Signing out on a shared phone should leave no owner data behind, as long as
      // the server still has it.
      persistBookings(state.bookings, { dropOwnerFields: Boolean(state.remoteClient) });
    }
    render();
  }

  function getSupabaseConfig() {
    const config = window.WILLOW_SUPABASE_CONFIG || {};
    const url = clean(config.url);
    const anonKey = clean(config.anonKey || config.publishableKey);
    if (!url || !anonKey) return null;
    return {
      url,
      anonKey,
      adminUsername: clean(config.adminUsername) || ADMIN_USERNAME,
      adminEmail: clean(config.adminEmail),
    };
  }

  function createRemoteClient(config) {
    if (!config) return null;
    if (!window.supabase?.createClient) {
      state.remoteError = "Supabase client library did not load";
      return null;
    }
    return window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        // The owner is reloaded into the page after signing in, so the session has
        // to outlive that reload. Logging out clears it and reloads again.
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  async function hydrateRemote() {
    if (!state.remoteConfig) return;
    await loadSupabaseLibrary();
    state.remoteClient = createRemoteClient(state.remoteConfig);
    if (!state.remoteClient) return;
    await restoreOwnerSession();
    const remoteBookings = await loadBookings();
    state.bookings = remoteBookings;
    render();
    if (state.isAdmin && takePendingOwnerPanel()) openAdminPanel();
  }

  function loadSupabaseLibrary() {
    if (window.supabase?.createClient) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-willow-supabase]");
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", () => reject(new Error("Supabase client library failed")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.async = true;
      script.dataset.willowSupabase = "true";
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => reject(new Error("Supabase client library failed")), {
        once: true,
      });
      document.head.append(script);
    });
  }

  function withTimeout(promise, milliseconds, message) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error(message)), milliseconds);
      }),
    ]);
  }

  async function signInRemoteAdmin(username, password) {
    if (username !== state.remoteConfig.adminUsername) throw new Error(t("adminLoginError"));
    if (!state.remoteConfig.adminEmail) throw new Error(t("adminEmailMissing"));

    const { error } = await state.remoteClient.auth.signInWithPassword({
      email: state.remoteConfig.adminEmail,
      password,
    });
    if (error) throw new Error(t("adminLoginError"));

    const {
      data: { user },
      error: userError,
    } = await state.remoteClient.auth.getUser();
    if (userError) throw new Error(t("adminLoginError"));
    if (!isRemoteOwner(user)) {
      await state.remoteClient.auth.signOut();
      throw new Error(t("adminRoleMissing"));
    }

    state.isAdmin = true;
    rememberOwnerSession(true);
    state.bookings = await loadBookings();
    render();
    reloadPage();
  }

  async function signOutAdmin() {
    if (state.remoteClient) {
      await state.remoteClient.auth.signOut();
    }
    rememberOwnerSession(false);
    setAdminMode(false);
    state.bookings = await loadBookings();
    render();
    reloadPage();
  }

  function reloadPage() {
    try {
      window.location.reload();
    } catch (error) {
      console.warn("Willow could not reload the page", error);
    }
  }

  // Survives the reload but not closing the tab, so a shared phone does not stay
  // signed in as owner.
  function rememberOwnerSession(isOwner) {
    try {
      if (isOwner) {
        window.sessionStorage.setItem(OWNER_SESSION_KEY, "1");
        // So signing in still lands on the owner panel, reload and all.
        window.sessionStorage.setItem(OWNER_PANEL_KEY, "1");
      } else {
        window.sessionStorage.removeItem(OWNER_SESSION_KEY);
        window.sessionStorage.removeItem(OWNER_PANEL_KEY);
      }
    } catch {
      /* private mode: the session simply does not survive the reload */
    }
  }

  function takePendingOwnerPanel() {
    try {
      if (window.sessionStorage.getItem(OWNER_PANEL_KEY) !== "1") return false;
      window.sessionStorage.removeItem(OWNER_PANEL_KEY);
      return true;
    } catch {
      return false;
    }
  }

  function hadOwnerSession() {
    try {
      return window.sessionStorage.getItem(OWNER_SESSION_KEY) === "1";
    } catch {
      return false;
    }
  }

  async function restoreOwnerSession() {
    if (!hadOwnerSession()) return;
    if (!state.remoteClient) {
      // Local-only mode has no server to check against; the gate is cosmetic anyway.
      state.isAdmin = true;
      return;
    }
    const { data, error } = await state.remoteClient.auth.getUser();
    if (error || !isRemoteOwner(data?.user)) {
      rememberOwnerSession(false);
      return;
    }
    state.isAdmin = true;
  }

  // Reaching the project but finding no tables is a setup step left undone, not a
  // network problem, and saying "offline" would send someone looking in the wrong place.
  function isMissingTableError(error) {
    if (error?.code === "PGRST205" || error?.code === "42P01") return true;
    return /schema cache|does not exist|relation .* does not exist/i.test(error?.message || "");
  }

  function isRemoteOwner(user) {
    const metadata = user?.app_metadata || {};
    return metadata.willow_role === "owner" || metadata.role === "owner";
  }

  function syncModalLock() {
    const hasOpenModal =
      !els.adminLoginModal.hidden ||
      !els.adminPanelModal.hidden ||
      !els.bookingModal.hidden ||
      !els.formModal.hidden ||
      !els.importModal.hidden;
    document.body.classList.toggle("modal-open", hasOpenModal);
  }

  function render() {
    translatePage();
    renderAdminUi();
    renderAdminPanel();
    renderWeekdays();
    renderCalendar();
    renderSelectedDate();
    renderSearchResults();
    renderSyncStatus();
  }

  function translatePage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
    els.languageToggle.textContent = state.lang === "te" ? "English" : "తెలుగు";
    renderNotePreview();
  }

  function renderAdminUi() {
    document.body.classList.toggle("admin-mode", state.isAdmin);
    els.adminButtonLabel.textContent = state.isAdmin ? t("ownerView") : t("admin");
  }

  function renderAdminPanel() {
    if (!state.isAdmin) return;
    const activeBookings = state.bookings.filter((booking) => booking.status !== "cancelled");
    const confirmedBookings = activeBookings.filter((booking) => booking.status === "confirmed");
    const totalRevenue = activeBookings.reduce((sum, booking) => sum + bookingAmount(booking), 0);
    const confirmedRevenue = confirmedBookings.reduce(
      (sum, booking) => sum + bookingAmount(booking),
      0,
    );
    const bookedNights = activeBookings.reduce((sum, booking) => sum + nights(booking), 0);
    const averageBooking = activeBookings.length ? totalRevenue / activeBookings.length : 0;

    els.financeTotal.textContent = formatMoney(totalRevenue);
    els.financeConfirmed.textContent = formatMoney(confirmedRevenue);
    els.financeBookings.textContent = String(activeBookings.length);
    els.financeNights.textContent = String(bookedNights);
    els.financeAverage.textContent = formatMoney(averageBooking);
  }

  function renderNotePreview() {
    const note = clean(els.notes.value);
    const translated = translateCaretakerNote(note);
    const shouldShow = note && translated && translated !== note;
    els.notePreview.hidden = !shouldShow;
    els.notePreview.textContent = shouldShow
      ? `${t("noteTeluguPreview")}: ${translated}`
      : "";
  }

  function activeBookings() {
    return state.bookings.filter((booking) => booking.status !== "cancelled");
  }

  // The stored status goes stale the moment a date passes, so the chip guests and
  // caretakers see is derived from today instead.
  function liveStatus(booking) {
    if (booking.status === "cancelled") return "cancelled";
    const todayIso = toISO(today());
    if (booking.checkOut < todayIso) return "completed";
    if (booking.checkIn === todayIso) return "arriving";
    if (booking.checkOut === todayIso) return "checkout";
    if (booking.checkIn < todayIso && todayIso < booking.checkOut) return "staying";
    return "confirmed";
  }

  // Reads the day cell out for a screen reader, so only the names matter.
  function guestNameList(bookings) {
    const names = bookings.map((booking) => firstName(booking.guestName) || getSource(booking.platform).label);
    const shown = names.slice(0, 3).join(", ");
    return names.length > 3 ? `${shown} +${names.length - 3}` : shown;
  }

  function renderSyncStatus() {
    const canSync = Boolean(state.remoteConfig);
    els.refreshButton.hidden = !canSync;

    let text = t("syncLocalOnly");
    let tone = "local";
    if (canSync && state.isSyncing) {
      text = t("syncing");
      tone = "busy";
    } else if (canSync && state.remoteNeedsSetup) {
      text = t("syncNotSetUp");
      tone = "warn";
    } else if (canSync && state.remoteError) {
      text = t("syncOffline");
      tone = "warn";
    } else if (canSync && state.lastSyncedAt) {
      text = `${t("syncUpdated")} ${formatClock(state.lastSyncedAt)}`;
      tone = "ok";
    } else if (canSync) {
      text = t("syncing");
      tone = "busy";
    }

    els.syncStatus.textContent = text;
    els.syncStatus.dataset.tone = tone;
    els.syncStatus.title = state.remoteError || "";
  }

  function searchMatches(term) {
    const needle = normalizeToken(term);
    const digits = term.replace(/\D/g, "");
    if (needle.length < 2 && digits.length < 3) return [];

    const matches = state.bookings.filter((booking) => {
      const fields = [booking.guestName, booking.villaRoom];
      if (state.isAdmin) fields.push(booking.bookingId, booking.email, booking.vehicle);
      const haystack = normalizeToken(fields.filter(Boolean).join(" "));
      const phoneDigits = clean(booking.phone).replace(/\D/g, "");
      return (
        (needle.length >= 2 && haystack.includes(needle)) ||
        (digits.length >= 3 && phoneDigits.includes(digits))
      );
    });

    const todayIso = toISO(today());
    const upcoming = matches
      .filter((booking) => booking.checkOut >= todayIso)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    const past = matches
      .filter((booking) => booking.checkOut < todayIso)
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
    return [...upcoming, ...past];
  }

  function renderSearchResults() {
    const term = clean(state.searchTerm);
    if (!term) {
      els.searchResults.hidden = true;
      els.searchResults.innerHTML = "";
      return;
    }

    const matches = searchMatches(term);
    if (!matches.length) {
      els.searchResults.hidden = false;
      els.searchResults.innerHTML = `<p class="search-empty">${escapeHtml(t("searchNoResults"))}</p>`;
      return;
    }

    const shown = matches.slice(0, 6);
    const more =
      matches.length > shown.length
        ? `<p class="search-empty">+${matches.length - shown.length}</p>`
        : "";

    els.searchResults.hidden = false;
    els.searchResults.innerHTML =
      shown
        .map((booking) => {
          const source = getSource(booking.platform);
          const meta = `${formatShortDate(booking.checkIn)} – ${formatShortDate(booking.checkOut)} · ${source.label}`;
          return `
            <button class="search-hit" type="button" data-goto="${escapeAttr(booking.checkIn)}">
              <span class="search-hit-name">
                <span class="source-dot ${source.className}"></span>
                ${escapeHtml(booking.guestName)}
              </span>
              <span class="search-hit-meta">${escapeHtml(meta)}</span>
            </button>
          `;
        })
        .join("") + more;
  }

  function overlappingBookings(booking) {
    const room = normalizeToken(booking.villaRoom);
    return activeBookings().filter(
      (item) =>
        item.id !== booking.id &&
        normalizeToken(item.villaRoom) === room &&
        booking.checkIn < item.checkOut &&
        item.checkIn < booking.checkOut,
    );
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
    const focusIso = isoInMonth(selected, firstDay)
      ? selected
      : isoInMonth(todayIso, firstDay)
        ? todayIso
        : toISO(firstDay);

    els.monthGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      const iso = toISO(date);
      const bookings = bookingsForDate(iso);
      const segments = bookings.map((booking) => bookingSegment(booking, iso));
      const bookingPills = bookings
        .sort((a, b) => segmentOrder(a, iso) - segmentOrder(b, iso))
        .slice(0, 3)
        .map((booking) => renderCalendarBooking(booking, iso))
        .join("");
      const more =
        bookings.length > 3
          ? `<span class="more-count">+${bookings.length - 3}</span>`
          : "";
      const classes = [
        "day-cell",
        `dow-${date.getDay()}`,
        segments.length ? "has-booking" : "",
        segments.includes("start") || segments.includes("same-day") ? "has-start" : "",
        segments.includes("middle") ? "has-middle" : "",
        date.getMonth() !== month ? "outside" : "",
        iso === todayIso ? "today" : "",
        iso === selected ? "selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const countWord = bookings.length === 1 ? t("bookingWord") : t("bookingsWord");
      const ariaLabel = bookings.length
        ? `${formatFullDate(iso)}, ${bookings.length} ${countWord}: ${guestNameList(bookings)}`
        : `${formatFullDate(iso)}, ${bookings.length} ${countWord}`;

      return `
        <button
          class="${classes}"
          type="button"
          data-date="${iso}"
          tabindex="${iso === focusIso ? 0 : -1}"
          ${iso === todayIso ? 'aria-current="date"' : ""}
          aria-pressed="${iso === selected}"
          aria-label="${escapeHtml(ariaLabel)}"
        >
          <span class="day-number">${date.getDate()}</span>
          <span class="booking-stack">${bookingPills}${more}</span>
        </button>
      `;
    }).join("");
  }

  function isoInMonth(iso, monthStart) {
    if (!iso) return false;
    const date = parseISO(iso);
    return (
      date.getMonth() === monthStart.getMonth() && date.getFullYear() === monthStart.getFullYear()
    );
  }

  function renderCalendarBooking(booking, isoDate) {
    const source = getSource(booking.platform);
    const segment = bookingSegment(booking, isoDate);
    const guest = firstName(booking.guestName) || source.label;
    const guestTotal = Number(booking.adults || 0) + Number(booking.children || 0);
    const guestSuffix = guestTotal > 1 ? ` +${guestTotal - 1}` : "";
    // A stay crossing into a new week would otherwise be an anonymous bar, so the
    // name is repeated on the Sunday that starts the row.
    const startsRow = parseISO(isoDate).getDay() === 0;
    const showLabel =
      segment === "start" || segment === "same-day" || (segment === "middle" && startsRow);
    const label = `${guest}${guestSuffix}`;
    const style = segment === "start"
      ? ` style="--booking-width: ${bookingStartWidth(booking, isoDate)}"`
      : "";

    return `
      <span
        class="booking-pill ${source.className} ${segment}"
        title="${escapeAttr(`${booking.guestName} - ${source.label}`)}"
        ${style}
      >
        ${showLabel ? `<span class="booking-name">${escapeHtml(label)}</span>` : ""}
      </span>
    `;
  }

  function bookingStartWidth(booking, isoDate) {
    const start = parseISO(isoDate);
    const checkout = parseISO(booking.checkOut);
    const nightsUntilCheckout = Math.max(1, Math.round((checkout - start) / DAY_MS));
    const remainingDaysInWeek = 6 - start.getDay();
    const reachesNextRow = nightsUntilCheckout > remainingDaysInWeek;
    const halfColumns = reachesNextRow
      ? remainingDaysInWeek * 2 + 1
      : nightsUntilCheckout * 2;
    const gapPixels = Math.max(0, Math.ceil(halfColumns / 2) * 8);
    return `calc(${halfColumns * 100}% + ${gapPixels}px)`;
  }

  function bookingSegment(booking, isoDate) {
    if (booking.checkIn === isoDate && booking.checkOut === isoDate) return "same-day";
    if (booking.checkIn === isoDate) return "start";
    if (booking.checkOut === isoDate) return "end";
    return "middle";
  }

  function segmentOrder(booking, isoDate) {
    const segment = bookingSegment(booking, isoDate);
    return { end: 0, middle: 1, "same-day": 1, start: 2 }[segment] ?? 1;
  }

  function renderSelectedDate() {
    if (!state.bookings.length) {
      els.selectedTitle.textContent = state.selectedDate ? formatFullDate(state.selectedDate) : t("calendar");
      els.selectedCount.textContent = "0";
      els.selectedBookings.innerHTML = `
        <div class="empty-state">
          <strong>${escapeHtml(t("emptyLoaded"))}</strong>
          <span>${escapeHtml(t("emptyLoadedHelp"))}</span>
        </div>
      `;
      return;
    }

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
    const live = liveStatus(booking);
    const phone = booking.phone || "";
    const callHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
    const whatsappHref = whatsappUrl(phone);
    const contactActions = phone
      ? `
          <a class="contact-link" href="${escapeAttr(callHref)}">
            <svg><use href="#icon-phone"></use></svg>
            <span>${escapeHtml(t("call"))}</span>
          </a>
          <a class="contact-link" href="${escapeAttr(whatsappHref)}" target="_blank" rel="noreferrer">
            <svg><use href="#icon-message"></use></svg>
            <span>${escapeHtml(t("whatsapp"))}</span>
          </a>
        `
      : `<span class="contact-missing">${escapeHtml(t("phonePending"))}</span>`;
    const guestCount = `${booking.adults || 0} ${t("adults")}, ${booking.children || 0} ${t("children")}, ${booking.pets || 0} ${t("pets")}`;
    const dateText = `${formatShortDate(booking.checkIn)} ${checkInTimeText(booking)} - ${formatShortDate(booking.checkOut)} ${checkoutTimeText(booking)} (${nights(booking)} ${t("nights")})`;
    const notes = noteForDisplay(booking.notes);
    const optionalDetails = [
      detail(t("requests"), booking.requests, true),
      detail(t("notes"), notes, true),
    ].join("");
    const adminDetails = state.isAdmin
      ? [
          detail(t("status"), optionLabel(STATUS_OPTIONS, booking.status)),
          detail(t("bookingId"), booking.bookingId),
          detail(t("idProof"), optionLabel(ID_OPTIONS, booking.idProof)),
          detail(t("email"), booking.email),
          detail(t("vehicle"), booking.vehicle),
          detail(t("amountPaid"), formatMoney(bookingAmount(booking))),
        ].join("")
      : "";
    const adminActions = state.isAdmin
      ? `
          <button class="ghost-button" type="button" data-action="edit" data-id="${escapeAttr(booking.id)}">
            <svg><use href="#icon-edit"></use></svg>
            <span>${escapeHtml(t("edit"))}</span>
          </button>
          <button class="danger-button" type="button" data-action="delete" data-id="${escapeAttr(booking.id)}">
            <svg><use href="#icon-trash"></use></svg>
            <span>${escapeHtml(t("delete") || "Delete")}</span>
          </button>
        `
      : "";

    return `
      <article class="guest-card">
        <div class="guest-top">
          <div class="guest-name">
            <h3>${escapeHtml(booking.guestName)}</h3>
            <p class="${phone ? "" : "missing-phone"}">${escapeHtml(phone || t("phonePending"))}</p>
          </div>
          <div class="guest-chips">
            <span class="source-chip ${source.className}">${escapeHtml(source.label)}</span>
            <span class="status-chip ${live}">${escapeHtml(optionLabel(STATUS_OPTIONS, live))}</span>
          </div>
        </div>

        <div class="detail-grid">
          ${detail(t("dateRange"), dateText)}
          ${detail(t("checkInTime"), displayTime(booking.checkInTime, DEFAULT_CHECK_IN_TIME))}
          ${detail(t("arrivalTime"), booking.arrivalTime || t("noValue"))}
          ${detail(t("checkoutTime"), displayTime(booking.checkoutTime, DEFAULT_CHECKOUT_TIME))}
          ${detail(t("villaRoom"), booking.villaRoom)}
          ${detail(t("guests"), guestCount)}
          ${adminDetails}
          ${optionalDetails}
        </div>

        <div class="booking-actions">
          ${contactActions}
          ${adminActions}
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

  function noteForDisplay(note) {
    const original = clean(note);
    if (!original) return "";
    if (state.lang !== "te") return original;

    const translated = translateCaretakerNote(original);
    if (translated === original) return original;

    return translated;
  }

  function translateCaretakerNote(note) {
    const original = clean(note);
    if (!/[a-z]/i.test(original)) return original;

    let translated = original;
    const phraseMap = [
      ["call before arrival", "రాకముందు కాల్ చేయండి"],
      ["call guest", "అతిథికి కాల్ చేయండి"],
      ["late check out", "ఆలస్యంగా చెక్-అవుట్"],
      ["late checkout", "ఆలస్యంగా చెక్-అవుట్"],
      ["early check out", "ముందుగా చెక్-అవుట్"],
      ["early checkout", "ముందుగా చెక్-అవుట్"],
      ["late check in", "ఆలస్యంగా చెక్-ఇన్"],
      ["late check-in", "ఆలస్యంగా చెక్-ఇన్"],
      ["early check in", "ముందుగా చెక్-ఇన్"],
      ["early check-in", "ముందుగా చెక్-ఇన్"],
      ["id pending", "ఐడీ మిగిలింది"],
      ["collect id", "ఐడీ తీసుకోండి"],
      ["need extra towels", "అదనపు తువ్వాళ్లు కావాలి"],
      ["extra towels", "అదనపు తువ్వాళ్లు"],
      ["need towels", "తువ్వాళ్లు కావాలి"],
      ["room cleaning", "గది శుభ్రం"],
      ["clean room", "గది శుభ్రం చేయండి"],
      ["baby cot", "బేబీ కాట్"],
      ["water bottles", "నీళ్ల బాటిళ్లు"],
      ["water bottle", "నీళ్ల బాటిల్"],
      ["airport pickup", "ఎయిర్‌పోర్ట్ పికప్"],
      ["railway station", "రైల్వే స్టేషన్"],
    ];

    phraseMap.forEach(([english, telugu]) => {
      const pattern = escapeRegExp(english).replace(/\s+/g, "\\s+");
      translated = translated.replace(new RegExp(`\\b${pattern}\\b`, "gi"), telugu);
    });

    const wordMap = {
      add: "జోడించండి",
      afternoon: "మధ్యాహ్నం",
      and: "మరియు",
      arrive: "వస్తారు",
      arrival: "రాక",
      bed: "పడక",
      beds: "పడకలు",
      breakfast: "అల్పాహారం",
      bring: "తీసుకురండి",
      car: "కారు",
      cat: "పిల్లి",
      cats: "పిల్లులు",
      checkin: "చెక్-ఇన్",
      checkout: "చెక్-అవుట్",
      clean: "శుభ్రం",
      coming: "వస్తున్నారు",
      dinner: "రాత్రి భోజనం",
      dog: "కుక్క",
      dogs: "కుక్కలు",
      driver: "డ్రైవర్",
      early: "ముందుగా",
      evening: "సాయంత్రం",
      extra: "అదనపు",
      food: "భోజనం",
      guest: "అతిథి",
      guests: "అతిథులు",
      id: "ఐడీ",
      key: "తాళం చెవి",
      late: "ఆలస్యంగా",
      lunch: "మధ్యాహ్న భోజనం",
      morning: "ఉదయం",
      need: "కావాలి",
      needs: "కావాలి",
      night: "రాత్రి",
      nonveg: "నాన్ వెజ్",
      parking: "పార్కింగ్",
      pet: "పెంపుడు జంతువు",
      pets: "పెంపుడు జంతువులు",
      pickup: "పికప్",
      please: "దయచేసి",
      room: "గది",
      towels: "తువ్వాళ్లు",
      veg: "వెజ్",
      water: "నీళ్లు",
      with: "తో",
    };

    translated = translated.replace(/\b[a-z][a-z-]*\b/g, (word) => {
      const key = word.replace(/-/g, "");
      return wordMap[key] || word;
    });

    translated = translated
      .replace(/\s+/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim();

    return translated === original ? original : translated;
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
      amountPaid: clean(form.get("amountPaid")),
      checkIn: clean(form.get("checkIn")),
      checkInTime: clean(form.get("checkInTime")),
      checkOut: clean(form.get("checkOut")),
      checkoutTime: clean(form.get("checkoutTime")),
      arrivalTime: clean(form.get("arrivalTime")),
      villaRoom: clean(form.get("villaRoom")),
      adults: Number(form.get("adults") || 1),
      children: Number(form.get("children") || 0),
      pets: Number(form.get("pets") || 0),
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
    setValue("amountPaid", booking.amountPaid);
    setValue("checkIn", booking.checkIn);
    setValue("checkInTime", booking.checkInTime || DEFAULT_CHECK_IN_TIME);
    setValue("checkOut", booking.checkOut);
    setValue("checkoutTime", booking.checkoutTime || DEFAULT_CHECKOUT_TIME);
    setValue("arrivalTime", booking.arrivalTime);
    setValue("villaRoom", booking.villaRoom);
    setValue("adults", booking.adults);
    setValue("children", booking.children);
    setValue("pets", booking.pets || 0);
    setValue("bookingStatus", booking.status);
    setValue("idProof", booking.idProof);
    setValue("email", booking.email);
    setValue("vehicle", booking.vehicle);
    setValue("requests", booking.requests);
    setValue("notes", booking.notes);
    renderNotePreview();
  }

  function resetForm() {
    els.bookingForm.reset();
    els.bookingInternalId.value = "";
    const base = state.selectedDate || toISO(today());
    setValue("checkIn", base);
    setValue("checkInTime", DEFAULT_CHECK_IN_TIME);
    setValue("checkOut", toISO(addDays(parseISO(base), 1)));
    setValue("checkoutTime", DEFAULT_CHECKOUT_TIME);
    setValue("villaRoom", "Willow Villa");
    setValue("adults", 2);
    setValue("children", 0);
    setValue("pets", 0);
    setValue("platform", "airbnb");
    setValue("bookingStatus", "confirmed");
    setValue("idProof", "pending");
    setValue("amountPaid", "");
    renderNotePreview();
  }

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value ?? "";
  }

  async function loadBookings() {
    const localBookings = loadLocalBookings();
    if (state.remoteClient) {
      try {
        const remoteBookings = await withTimeout(
          fetchRemoteBookings(),
          REMOTE_TIMEOUT_MS,
          "Supabase bookings timed out",
        );
        // An empty server plus a device that still holds bookings means the shared
        // storage has not been filled yet. Never let that wipe the only copy: the
        // owner uploads it on sign-in, and until then the device keeps what it has.
        if (!remoteBookings.length && localBookings.length) {
          if (state.isAdmin) await syncRemoteBookings(localBookings);
          persistBookings(localBookings);
          state.remoteError = "";
          state.remoteNeedsSetup = false;
          state.lastSyncedAt = Date.now();
          return localBookings;
        }
        persistBookings(remoteBookings);
        state.remoteError = "";
        state.remoteNeedsSetup = false;
        state.lastSyncedAt = Date.now();
        return remoteBookings;
      } catch (error) {
        state.remoteError = error.message || String(error);
        state.remoteNeedsSetup = isMissingTableError(error);
        console.warn("Willow cloud sync unavailable", error);
      }
    }
    return localBookings;
  }

  function loadLocalBookings() {
    const stored = storage.get(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed
            .map((booking) => {
              try {
                return normalizeBooking(booking);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        }
      } catch {
        storage.remove(STORAGE_KEY);
      }
    }
    return [];
  }

  // Owner fields are only dropped when the caller knows Supabase already holds them.
  // Stripping a copy that exists nowhere else would simply destroy it.
  function persistBookings(bookings, { dropOwnerFields = false } = {}) {
    const safe = dropOwnerFields ? bookings.map(stripOwnerFields) : bookings;
    storage.set(STORAGE_KEY, JSON.stringify(safe));
  }

  function stripOwnerFields(booking) {
    const { amountPaid, bookingId, email, vehicle, idProof, ...caretakerFields } = booking;
    return caretakerFields;
  }

  async function saveBookings({ syncRemote = true } = {}) {
    persistBookings(state.bookings);
    if (!syncRemote || !state.remoteClient || !state.isAdmin) return;
    try {
      await syncRemoteBookings(state.bookings);
      state.remoteError = "";
    } catch (error) {
      state.remoteError = error.message || String(error);
      console.warn("Willow cloud save failed", error);
      toast(t("syncFailed"));
    }
  }

  async function fetchRemoteBookings() {
    const { data: publicRows, error: publicError } = await state.remoteClient
      .from("bookings")
      .select("*")
      .order("check_in", { ascending: true })
      .order("guest_name", { ascending: true });
    if (publicError) throw publicError;

    const privateRows = state.isAdmin && publicRows.length
      ? await fetchRemotePrivateRows(publicRows.map((row) => row.id))
      : [];
    return mergeRemoteRows(publicRows, privateRows);
  }

  async function fetchRemotePrivateRows(bookingIds) {
    const { data, error } = await state.remoteClient
      .from("booking_private_details")
      .select("*")
      .in("booking_id", bookingIds);
    if (error) throw error;
    return data || [];
  }

  async function syncRemoteBookings(bookings) {
    if (!bookings.length) return;
    const normalized = bookings.map(normalizeBooking);
    const publicRows = normalized.map(bookingToPublicRow);
    const privateRows = normalized.map(bookingToPrivateRow);

    const { error: publicError } = await state.remoteClient
      .from("bookings")
      .upsert(publicRows, { onConflict: "id" });
    if (publicError) throw publicError;

    const { error: privateError } = await state.remoteClient
      .from("booking_private_details")
      .upsert(privateRows, { onConflict: "booking_id" });
    if (privateError) throw privateError;
  }

  async function deleteRemoteBooking(id) {
    if (!state.remoteClient || !state.isAdmin) return;
    const { error } = await state.remoteClient.from("bookings").delete().eq("id", id);
    if (error) {
      state.remoteError = error.message || String(error);
      toast(t("syncFailed"));
      throw error;
    }
  }

  function bookingToPublicRow(booking) {
    return {
      id: booking.id,
      guest_name: booking.guestName,
      phone: booking.phone || null,
      platform: booking.platform,
      check_in: booking.checkIn,
      check_in_time: booking.checkInTime || DEFAULT_CHECK_IN_TIME,
      check_out: booking.checkOut,
      checkout_time: booking.checkoutTime || DEFAULT_CHECKOUT_TIME,
      arrival_time: booking.arrivalTime || null,
      villa_room: booking.villaRoom || "Willow Villa",
      adults: booking.adults || 1,
      children: booking.children || 0,
      pets: booking.pets || 0,
      status: booking.status || "confirmed",
      requests: booking.requests || null,
      notes: booking.notes || null,
    };
  }

  function bookingToPrivateRow(booking) {
    const amountText = clean(booking.amountPaid);
    return {
      booking_id: booking.id,
      external_booking_id: booking.bookingId || null,
      amount_paid: amountText ? bookingAmount(booking) : null,
      id_proof: booking.idProof || "pending",
      email: booking.email || null,
      vehicle: booking.vehicle || null,
    };
  }

  function mergeRemoteRows(publicRows, privateRows) {
    const privateById = new Map(privateRows.map((row) => [row.booking_id, row]));
    return publicRows
      .map((row) => {
        const privateRow = privateById.get(row.id) || {};
        try {
          return normalizeBooking({
            id: row.id,
            guestName: row.guest_name,
            phone: row.phone,
            platform: row.platform,
            bookingId: privateRow.external_booking_id,
            amountPaid: privateRow.amount_paid == null ? "" : String(privateRow.amount_paid),
            checkIn: row.check_in,
            checkInTime: row.check_in_time,
            checkOut: row.check_out,
            checkoutTime: row.checkout_time,
            arrivalTime: row.arrival_time,
            villaRoom: row.villa_room,
            adults: Number(row.adults || 1),
            children: Number(row.children || 0),
            pets: Number(row.pets || 0),
            status: row.status,
            idProof: privateRow.id_proof,
            email: privateRow.email,
            vehicle: privateRow.vehicle,
            requests: row.requests,
            notes: row.notes,
          });
        } catch (error) {
          console.warn("Willow skipped an unusable booking row", row.id, error);
          return null;
        }
      })
      .filter(Boolean);
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
    if (!state.isAdmin) {
      openAdminLogin();
      toast(t("adminRequired"));
      return;
    }
    const file = els.importFile.files?.[0];
    if (!file) {
      toast(t("importInvalid"));
      return;
    }

    const fallbackSource = els.importSource.value || "direct";
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
      await importPdfFile(file, fallbackSource);
      return;
    }

    let imported = [];
    if (/\.(xlsx|xlsm|xls)$/.test(lowerName) || isExcelType(file.type)) {
      try {
        imported = parseRowBookings(await readExcelRows(file), fallbackSource);
      } catch (error) {
        console.warn("Willow Excel read failed", error);
        toast(t("excelUnreadable"));
        return;
      }
    } else {
      const text = await file.text();
      imported =
        lowerName.endsWith(".ics") || text.includes("BEGIN:VCALENDAR")
          ? parseIcsBookings(text, fallbackSource)
          : parseCsvBookings(text, fallbackSource);
    }

    if (!imported.length) {
      toast(t("importInvalid"));
      return;
    }

    const result = mergeBookings(imported);
    state.selectedDate = imported[0].checkIn;
    state.currentMonth = startOfMonth(parseISO(state.selectedDate));
    await saveBookings();
    render();
    closeImportModal();
    toast(`${t("importDone")} (${result.added + result.updated})`);
  }

  // A confirmation PDF is one booking read out of free text, so it lands in the
  // form for the owner to check rather than saving itself.
  async function importPdfFile(file, fallbackSource) {
    let text = "";
    try {
      text = await extractPdfText(file);
    } catch (error) {
      console.warn("Willow PDF read failed", error);
      toast(t("pdfUnreadable"));
      return;
    }

    const [booking] = parsePdfBookings(text, fallbackSource);
    if (!booking) {
      toast(looksLikeStatement(text) ? t("pdfStatement") : t("pdfNoBooking"));
      return;
    }

    state.selectedDate = booking.checkIn;
    state.currentMonth = startOfMonth(parseISO(booking.checkIn));
    closeImportModal();
    resetForm();
    fillForm({ ...booking, id: "" });
    render();
    openFormModal();
    toast(t("pdfReview"));
  }

  function parseCsvBookings(text, fallbackSource) {
    return parseRowBookings(parseCsvRows(text), fallbackSource);
  }

  // Shared by CSV and Excel: both arrive as rows of cells.
  function parseRowBookings(rows, fallbackSource) {
    if (rows.length < 2) return [];

    const headerIndex = findHeaderRow(rows);
    const headers = rows[headerIndex].map((header) => fieldForHeader(header));
    if (!headers.some(Boolean)) return [];

    const bodyRows = rows.slice(headerIndex + 1);
    const dateOrder = detectDateOrder(bodyRows, headers);

    return bodyRows
      .map((row) => {
        const raw = {};
        headers.forEach((field, index) => {
          // Exports repeat a field across columns (Amount and Gross earnings, say),
          // so an empty later column must not wipe a value already read.
          const value = clean(row[index]);
          if (field && value) raw[field] = value;
        });

        const source = sourceFromValue(raw.platform) || fallbackSource;
        const checkIn = normalizeImportedDate(raw.checkIn, dateOrder);
        // Airbnb's earnings export gives a start date and a night count, no end date.
        const checkOut =
          normalizeImportedDate(raw.checkOut, dateOrder) || checkOutFromNights(checkIn, raw.nights);
        if (!checkIn || !checkOut) return null;

        return normalizeBooking({
          id: "",
          guestName: raw.guestName || `${getSource(source).label} booking`,
          phone: raw.phone,
          platform: source,
          bookingId: raw.bookingId,
          amountPaid: raw.amountPaid,
          checkIn,
          checkInTime: raw.checkInTime,
          checkOut,
          checkoutTime: raw.checkoutTime,
          arrivalTime: raw.arrivalTime,
          villaRoom: raw.villaRoom || "Willow Villa",
          adults: Number(raw.adults || 1),
          children: Number(raw.children || 0),
          pets: Number(raw.pets || 0),
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

  function isExcelType(type) {
    return Boolean(type) && /sheet|excel|spreadsheet/i.test(type);
  }

  function loadExcelLibrary() {
    if (window.XLSX?.read) return Promise.resolve(window.XLSX);
    return new Promise((resolve, reject) => {
      const fail = () => reject(new Error("Excel reader failed to load"));
      const existing = document.querySelector("script[data-willow-excel]");
      const script = existing || document.createElement("script");

      script.addEventListener("load", () => resolve(window.XLSX), { once: true });
      script.addEventListener("error", fail, { once: true });
      if (existing) return;

      script.src = EXCEL_LIBRARY_URL;
      script.async = true;
      script.dataset.willowExcel = "true";
      document.head.append(script);
    });
  }

  async function readExcelRows(file) {
    const library = await loadExcelLibrary();
    const data = new Uint8Array(await file.arrayBuffer());
    // cellDates keeps real date cells as dates, so a sheet that displays 04/09/2026
    // cannot be misread as 9 April.
    const workbook = library.read(data, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const rows = library.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: "",
      blankrows: false,
    });
    return rows.map((row) => row.map(cellToText));
  }

  function cellToText(value) {
    if (value instanceof Date) return toISO(value);
    if (typeof value === "number") return String(value);
    return clean(value);
  }

  function loadPdfLibrary() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return import(PDF_LIBRARY_URL).then((library) => {
      library.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      window.pdfjsLib = library;
      return library;
    });
  }

  async function extractPdfText(file) {
    const library = await loadPdfLibrary();
    const data = new Uint8Array(await file.arrayBuffer());
    const document_ = await library.getDocument({ data }).promise;

    let text = "";
    for (let pageNumber = 1; pageNumber <= document_.numPages; pageNumber += 1) {
      const page = await document_.getPage(pageNumber);
      const content = await page.getTextContent();
      text += content.items
        .map((item) => (item.str || "") + (item.hasEOL ? "\n" : " "))
        .join("");
      text += "\n";
    }
    return text;
  }

  // Confirmation PDFs have no fixed shape, so this reads the labels the big
  // platforms actually print and leaves the result for the owner to check.
  function parsePdfBookings(text, fallbackSource) {
    const flat = clean(text).replace(/\r/g, "").replace(/[^\S\n]+/g, " ");
    if (!flat) return [];

    const platform = detectPlatform(flat) || fallbackSource || "direct";

    // A stay has to be labelled as one. Any PDF holds dates — a statement's title
    // range would otherwise become a booking running for years.
    const checkIn = findLabelledDate(flat, [
      "check[\\s.-]?in",
      "checkin",
      "arrival",
      "arriving",
      "from date",
    ]);
    if (!checkIn) return [];

    let checkOut = findLabelledDate(flat, [
      "check[\\s.-]?out",
      "checkout",
      "departure",
      "departing",
      "to date",
    ]);
    if (!checkOut || checkOut <= checkIn) {
      checkOut = collectDates(flat).find((date) => date > checkIn) || "";
    }
    if (!checkOut) {
      const nightsMatch = flat.match(/(\d+)\s*nights?/i);
      checkOut = toISO(addDays(parseISO(checkIn), nightsMatch ? Math.max(1, Number(nightsMatch[1])) : 1));
    }
    // Nobody books a villa for half a year; that length means the dates are wrong.
    if ((parseISO(checkOut) - parseISO(checkIn)) / DAY_MS > MAX_PDF_STAY_NIGHTS) return [];

    const adults = firstNumber(flat, /(\d+)\s*adults?/i) || firstNumber(flat, /(\d+)\s*guests?/i) || 1;
    const guestName =
      findLabelledValue(flat, [
        "guest name",
        "primary guest",
        "lead guest",
        "booked by",
        "traveller name",
        "traveler name",
        "customer name",
        "name",
        "guest",
        // Horizontal space only — a name must not run past the end of its line.
      ], "[A-Z][A-Za-z.'\\-]+(?:[^\\S\\n]+[A-Z][A-Za-z.'\\-]+){0,3}") || `${getSource(platform).label} booking`;

    return [
      normalizeBooking({
        id: "",
        guestName,
        phone: findPdfPhone(flat),
        platform,
        bookingId: findLabelledValue(flat, [
          "confirmation code",
          "confirmation number",
          "booking (?:id|number|reference|ref)",
          "reservation (?:id|number|code)",
          "itinerary (?:id|number)",
          "pnr",
          // Booking.com prints its number in space separated digit groups.
        ], "[A-Za-z0-9][A-Za-z0-9-]{3,24}(?:[^\\S\\n]\\d{2,6}){0,3}"),
        amountPaid: findPdfAmount(flat),
        checkIn,
        checkInTime: DEFAULT_CHECK_IN_TIME,
        checkOut,
        checkoutTime: DEFAULT_CHECKOUT_TIME,
        arrivalTime: "",
        villaRoom: "Willow Villa",
        adults,
        children: firstNumber(flat, /(\d+)\s*(?:child(?:ren)?|kids?)/i) || 0,
        pets: firstNumber(flat, /(\d+)\s*pets?/i) || 0,
        status: "confirmed",
        idProof: "pending",
        email: extractEmail(flat),
        vehicle: "",
        requests: findLabelledValue(flat, ["special requests?", "guest requests?"], "[^\\n]{3,120}"),
        notes: "",
      }),
    ];
  }

  // Earnings statements and payout reports are full of dates and money but hold no
  // stay at all, so they get told apart and refused with a message that points
  // somewhere useful.
  function looksLikeStatement(text) {
    return /earnings report|gross earnings|payout method|tax withheld|service fees|reporting period|transaction history/i.test(
      text,
    );
  }

  function detectPlatform(text) {
    const lower = text.toLowerCase();
    if (lower.includes("airbnb")) return "airbnb";
    if (lower.includes("booking.com")) return "booking";
    if (lower.includes("makemytrip") || lower.includes("make my trip")) return "makemytrip";
    return "";
  }

  const MONTHS = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
    september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };

  const DATE_SHAPES = [
    /\d{4}-\d{2}-\d{2}/,
    /\b\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9}\.?,?\s+\d{4}\b/,
    /\b[A-Za-z]{3,9}\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/,
    /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/,
  ];

  function parseLooseDate(value) {
    const text = clean(value);
    if (!text) return "";

    const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

    const dayFirst = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})\b/);
    if (dayFirst && MONTHS[dayFirst[2].toLowerCase()]) {
      return buildIso(dayFirst[3], MONTHS[dayFirst[2].toLowerCase()], dayFirst[1]);
    }

    const monthFirst = text.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
    if (monthFirst && MONTHS[monthFirst[1].toLowerCase()]) {
      return buildIso(monthFirst[3], MONTHS[monthFirst[1].toLowerCase()], monthFirst[2]);
    }

    // Indian confirmations print day first, so 04/09/2026 is 4 September.
    const numeric = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
    if (numeric) {
      let day = Number(numeric[1]);
      let month = Number(numeric[2]);
      const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
      if (month > 12 && day <= 12) [day, month] = [month, day];
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return buildIso(year, month, day);
    }
    return "";
  }

  function buildIso(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function collectDates(text) {
    const scanner = new RegExp(DATE_SHAPES.map((shape) => shape.source).join("|"), "g");
    const found = [];
    let match = scanner.exec(text);
    while (match) {
      const iso = parseLooseDate(match[0]);
      if (iso && !found.includes(iso)) found.push(iso);
      match = scanner.exec(text);
    }
    return found.sort();
  }

  function findLabelledDate(text, labels) {
    for (const label of labels) {
      const match = text.match(new RegExp(`${label}[^A-Za-z0-9]{0,4}([\\s\\S]{0,60})`, "i"));
      const found = match ? parseLooseDate(match[1]) : "";
      if (found) return found;
    }
    return "";
  }

  function findLabelledValue(text, labels, valuePattern) {
    for (const label of labels) {
      const match = text.match(new RegExp(`${label}\\s*[:\\-–]?\\s*(${valuePattern})`, "i"));
      if (match) return clean(match[1]);
    }
    return "";
  }

  function findPdfPhone(text) {
    const labelled = text.match(
      /(?:phone|mobile|contact|whats\s?app|tel)[^\d+]{0,12}(\+?\d[\d\s().-]{7,}\d)/i,
    );
    return labelled ? clean(labelled[1]) : extractPhone(text);
  }

  function findPdfAmount(text) {
    const labelled = text.match(
      /(?:total(?:\s+amount)?|amount\s+paid|grand\s+total|you\s+paid|total\s+payout)[^\d₹]{0,14}(?:₹|inr|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    );
    if (labelled) return labelled[1].replace(/,/g, "");
    const currency = text.match(/(?:₹|inr\s*|rs\.?\s*)([\d,]+(?:\.\d{1,2})?)/i);
    return currency ? currency[1].replace(/,/g, "") : "";
  }

  function firstNumber(text, pattern) {
    const match = text.match(pattern);
    return match ? Number(match[1]) : 0;
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
          amountPaid: "",
          checkIn,
          checkInTime: DEFAULT_CHECK_IN_TIME,
          checkOut,
          checkoutTime: DEFAULT_CHECKOUT_TIME,
          arrivalTime: "",
          villaRoom: "Willow Villa",
          adults: 1,
          children: 0,
          pets: 0,
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
    const checkIn = clean(booking.checkIn);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) {
      throw new Error(`Booking ${booking.id || ""} has no usable check-in date`);
    }
    const checkOut =
      booking.checkOut && booking.checkOut > checkIn
        ? booking.checkOut
        : toISO(addDays(parseISO(checkIn), 1));

    return {
      ...booking,
      checkIn,
      checkOut,
      adults: Number.isFinite(booking.adults) && booking.adults > 0 ? booking.adults : 1,
      children:
        Number.isFinite(booking.children) && booking.children >= 0 ? booking.children : 0,
      pets: Number.isFinite(booking.pets) && booking.pets >= 0 ? booking.pets : 0,
      status: booking.status || "confirmed",
      idProof: booking.idProof || "pending",
      amountPaid: clean(booking.amountPaid),
      checkInTime: clean(booking.checkInTime) || DEFAULT_CHECK_IN_TIME,
      checkoutTime: clean(booking.checkoutTime) || DEFAULT_CHECKOUT_TIME,
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

  function checkOutFromNights(checkIn, nightCount) {
    if (!checkIn) return "";
    const stayNights = Math.round(Number(clean(nightCount)));
    if (!Number.isFinite(stayNights) || stayNights < 1) return "";
    return toISO(addDays(parseISO(checkIn), stayNights));
  }

  // Platform exports often open with a title or a blank line before the real header.
  function findHeaderRow(rows) {
    const limit = Math.min(rows.length, 20);
    let best = -1;
    for (let index = 0; index < limit; index += 1) {
      const fields = rows[index].map(fieldForHeader).filter(Boolean);
      if (fields.includes("checkIn") && fields.length >= 2) return index;
      if (best < 0 && fields.length >= 2) best = index;
    }
    return best < 0 ? 0 : best;
  }

  function fieldForHeader(header) {
    const normalized = normalizeToken(header);
    const aliases = {
      guestName: [
        "guestname",
        "guest",
        "name",
        "customername",
        "customer",
        "primaryguest",
        "leadguest",
        "travellername",
        "travelername",
        "bookedby",
      ],
      phone: [
        "phone",
        "phonenumber",
        "mobile",
        "mobileno",
        "mobilenumber",
        "contact",
        "contactno",
        "contactnumber",
        "guestmobile",
      ],
      platform: ["platform", "source", "bookedthrough", "bookingplatform", "channel", "bookingsource", "ota"],
      bookingId: [
        "bookingid",
        "hotelbookingid",
        "reservationid",
        "reservationnumber",
        "bookingreference",
        "confirmationnumber",
        "confirmationcode",
        "voucherno",
        "voucherid",
        "reference",
      ],
      amountPaid: [
        "amountpaid",
        "amount",
        "amountreceived",
        "paid",
        "total",
        "totalamount",
        "grandtotal",
        "payableamount",
        "sellingprice",
        "revenue",
        "price",
        "bookingamount",
        "grossearnings",
        "netearnings",
        "paidout",
        "payout",
        "earnings",
      ],
      checkIn: ["checkin", "checkindate", "arrival", "arrivaldate", "fromdate", "startdate"],
      checkInTime: ["checkintime", "checkinhour", "starttime"],
      checkOut: ["checkout", "checkoutdate", "departure", "departuredate", "todate", "enddate"],
      nights: ["nights", "noofnights", "numberofnights", "totalnights"],
      checkoutTime: ["checkouttime", "checkouthour", "endtime"],
      arrivalTime: ["arrivaltime", "guestarrivaltime"],
      villaRoom: [
        "villaroom",
        "villa",
        "room",
        "roomno",
        "roomnumber",
        "roomtype",
        "unit",
        "listing",
        "property",
        "propertyname",
        "hotelname",
      ],
      adults: ["adults", "adult", "noofadults", "numberofadults", "guests", "noofguests", "totalguests", "pax"],
      children: ["children", "child", "kids", "noofchildren", "numberofchildren", "noofkids"],
      pets: ["pets", "pet", "dog", "dogs", "cat", "cats"],
      status: ["status", "bookingstatus"],
      idProof: ["idproof", "idstatus", "identityproof"],
      email: ["email", "emailid", "emailaddress", "guestemail"],
      vehicle: ["vehicle", "vehiclenumber", "carnumber"],
      requests: ["requests", "specialrequests"],
      notes: ["notes", "caretakernotes", "description", "details"],
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

  function normalizeImportedDate(value, order = "dayFirst") {
    const text = clean(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    const slashMatch = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
    if (slashMatch) {
      const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
      let day = Number(order === "monthFirst" ? slashMatch[2] : slashMatch[1]);
      let month = Number(order === "monthFirst" ? slashMatch[1] : slashMatch[2]);
      // This row disproves the assumed order on its own.
      if (month > 12 && day <= 12) [day, month] = [month, day];
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return buildIso(year, month, day);
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? "" : toISO(parsed);
  }

  // Indian exports write 04/09/2026 as 4 September; Airbnb writes it as 9 April.
  // Only the data can tell them apart, so scan the date columns for a day past 12.
  function detectDateOrder(rows, headers) {
    const dateColumns = headers
      .map((field, index) => (field === "checkIn" || field === "checkOut" ? index : -1))
      .filter((index) => index >= 0);

    let dayFirst = 0;
    let monthFirst = 0;
    rows.forEach((row) => {
      dateColumns.forEach((index) => {
        const match = clean(row[index]).match(/^(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}$/);
        if (!match) return;
        const first = Number(match[1]);
        const second = Number(match[2]);
        if (first > 12 && second <= 12) dayFirst += 1;
        else if (second > 12 && first <= 12) monthFirst += 1;
      });
    });

    return monthFirst > dayFirst ? "monthFirst" : "dayFirst";
  }

  function extractPhone(value) {
    return clean(value.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]);
  }

  function extractEmail(value) {
    return clean(value.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/)?.[0]);
  }

  function exportCsv() {
    if (!state.isAdmin) {
      openAdminLogin();
      toast(t("adminRequired"));
      return;
    }
    const columns = [
      ["guestName", t("guestName")],
      ["phone", t("phone")],
      ["platform", t("platform")],
      ["bookingId", t("bookingId")],
      ["amountPaid", t("amountPaid")],
      ["checkIn", t("checkIn")],
      ["checkInTime", t("checkInTime")],
      ["checkOut", t("checkOut")],
      ["checkoutTime", t("checkoutTime")],
      ["arrivalTime", t("arrivalTime")],
      ["villaRoom", t("villaRoom")],
      ["adults", t("adults")],
      ["children", t("children")],
      ["pets", t("pets")],
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
    element.setAttribute("role", "status");
    element.textContent = message;
    document.body.append(element);
    requestAnimationFrame(() => element.classList.add("show"));
    window.setTimeout(() => {
      element.classList.remove("show");
      window.setTimeout(() => element.remove(), 220);
    }, 2200);
  }

  function t(key) {
    return COPY[state.lang]?.[key] || COPY.en[key] || key;
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

  function displayTime(value, fallback) {
    const text = clean(value) || fallback;
    const match = text.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return text || t("noValue");
    const date = new Date(2026, 0, 1, Number(match[1]), Number(match[2]));
    return new Intl.DateTimeFormat(locale(), {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function formatClock(milliseconds) {
    return new Intl.DateTimeFormat(locale(), {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(milliseconds));
  }

  function checkInTimeText(booking) {
    const time = displayTime(booking.checkInTime, DEFAULT_CHECK_IN_TIME);
    return state.lang === "te" ? `${time} నుండి` : `from ${time}`;
  }

  function checkoutTimeText(booking) {
    const time = displayTime(booking.checkoutTime, DEFAULT_CHECKOUT_TIME);
    return state.lang === "te" ? `${time} వరకు` : `until ${time}`;
  }

  function nights(booking) {
    return Math.max(1, Math.round((parseISO(booking.checkOut) - parseISO(booking.checkIn)) / DAY_MS));
  }

  function bookingAmount(booking) {
    const raw = clean(booking.amountPaid).replace(/[^\d.]/g, "");
    const amount = Number(raw);
    return Number.isFinite(amount) ? amount : 0;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat(locale(), {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
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

  function credentialHash(value) {
    let hash = 5381;
    for (const char of value) {
      hash = ((hash << 5) + hash) ^ char.charCodeAt(0);
    }
    return hash >>> 0;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function firstName(value) {
    return clean(value).split(/\s+/)[0] || "";
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
