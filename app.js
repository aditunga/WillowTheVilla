(() => {
  const STORAGE_KEY = "willow-the-villa-bookings-v1";
  const LANGUAGE_KEY = "willow-the-villa-language";
  const ADMIN_USERNAME = "Venu";
  const ADMIN_PASSWORD_HASH = 862899077;
  const DEFAULT_CHECK_IN_TIME = "14:00";
  const DEFAULT_CHECKOUT_TIME = "11:00";
  const DAY_MS = 24 * 60 * 60 * 1000;
  const REMOTE_TIMEOUT_MS = 4500;
  let eventsBound = false;

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
      airbnb: "Airbnb",
      amountPaid: "చెల్లించిన మొత్తం",
      arrivalTime: "రాక సమయం",
      booking: "Booking.com",
      bookingId: "బుకింగ్ ఐడి",
      bookedNights: "బుక్ అయిన రాత్రులు",
      calendar: "క్యాలెండర్",
      call: "కాల్",
      cancelled: "రద్దు అయింది",
      caretaker: "సంరక్షకుల క్యాలెండర్",
      checkIn: "చెక్-ఇన్",
      checkInAt: "2 PM నుండి",
      checkInTime: "చెక్-ఇన్ సమయం",
      checkOut: "చెక్-అవుట్",
      checkOutAt: "11 AM వరకు",
      checkoutTime: "చెక్-అవుట్ సమయం",
      children: "పిల్లలు",
      clearForm: "క్లియర్",
      clearSelection: "సెలెక్షన్ క్లియర్",
      close: "మూసివేయి",
      combined: "Airbnb, Booking.com, MakeMyTrip",
      confirmDelete: "ఈ బుకింగ్ తొలగించాలా?",
      dateRange: "తేదీలు",
      delete: "తొలగించు",
      direct: "Direct",
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
      importFile: "CSV / ICS ఫైల్",
      importInvalid: "సరైన CSV లేదా ICS ఫైల్ ఎంచుకోండి",
      importShort: "ఇంపోర్ట్",
      importSource: "ఇంపోర్ట్ మూలం",
      invalidDates: "చెక్-అవుట్ తేదీ చెక్-ఇన్ తర్వాత ఉండాలి",
      averageBooking: "సగటు బుకింగ్",
      confirmedRevenue: "కన్ఫర్మ్డ్ ఆదాయం",
      financials: "ఫైనాన్షియల్స్",
      logout: "లాగౌట్",
      makemytrip: "MakeMyTrip",
      notes: "కేర్‌టేకర్ నోట్లు",
      nights: "రాత్రులు",
      noValue: "లేదు",
      noteTeluguPreview: "తెలుగు నోట్",
      ownerView: "ఓనర్ వ్యూ",
      pets: "పెంపుడు జంతువులు",
      phone: "ఫోన్ నంబర్ (అవసరం లేదు)",
      phonePending: "ఫోన్ నంబర్ అప్డేట్ చేయాలి",
      phonePlaceholder: "నంబర్ లేకపోతే ఖాళీగా వదిలేయండి",
      platform: "ఎక్కడ బుక్ అయింది",
      quickAdd: "జోడించు",
      requests: "అభ్యర్థనలు",
      saveBooking: "సేవ్",
      saved: "బుకింగ్ సేవ్ అయింది",
      selectedDate: "ఎంచుకున్న తేదీ",
      source: "మూలం",
      status: "స్థితి",
      syncFailed: "క్లౌడ్ సేవ్ కాలేదు. మళ్లీ ప్రయత్నించండి.",
      title: "ఒకే క్యాలెండర్‌లో అన్ని బుకింగ్‌లు",
      today: "ఈరోజు",
      totalBookings: "మొత్తం బుకింగ్‌లు",
      totalRevenue: "మొత్తం ఆదాయం",
      vehicle: "వాహనం నంబర్",
      villaRoom: "విల్లా/గది",
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
      airbnb: "Airbnb",
      amountPaid: "Amount paid",
      arrivalTime: "Arrival time",
      booking: "Booking.com",
      bookingId: "Booking ID",
      bookedNights: "Booked nights",
      calendar: "Calendar",
      call: "Call",
      cancelled: "Cancelled",
      caretaker: "Caretaker calendar",
      checkIn: "Check-in",
      checkInAt: "from 2 PM",
      checkInTime: "Check-in time",
      checkOut: "Check-out",
      checkOutAt: "until 11 AM",
      checkoutTime: "Checkout time",
      children: "Children",
      clearForm: "Clear",
      clearSelection: "Clear selection",
      close: "Close",
      combined: "Airbnb, Booking.com, MakeMyTrip",
      confirmDelete: "Delete this booking?",
      dateRange: "Dates",
      delete: "Delete",
      direct: "Direct",
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
      importFile: "CSV / ICS file",
      importInvalid: "Choose a valid CSV or ICS file",
      importShort: "Import",
      importSource: "Import source",
      invalidDates: "Check-out must be after check-in",
      averageBooking: "Average booking",
      confirmedRevenue: "Confirmed revenue",
      financials: "Financials",
      logout: "Logout",
      makemytrip: "MakeMyTrip",
      notes: "Caretaker notes",
      nights: "nights",
      noValue: "None",
      noteTeluguPreview: "Telugu note",
      ownerView: "Owner view",
      pets: "Pets",
      phone: "Phone number (optional)",
      phonePending: "Phone number to be updated",
      phonePlaceholder: "Leave blank if unavailable",
      platform: "Booked through",
      quickAdd: "Add",
      requests: "Requests",
      saveBooking: "Save",
      saved: "Booking saved",
      selectedDate: "Selected date",
      source: "Source",
      status: "Status",
      syncFailed: "Cloud save failed. Try again.",
      title: "All bookings in one calendar",
      today: "Today",
      totalBookings: "Total bookings",
      totalRevenue: "Total revenue",
      vehicle: "Vehicle number",
      villaRoom: "Villa/room",
      whatsapp: "WhatsApp",
    },
  };

  const state = {
    bookings: [],
    currentMonth: startOfMonth(today()),
    isAdmin: false,
    lang: localStorage.getItem(LANGUAGE_KEY) || "te",
    remoteClient: null,
    remoteConfig: null,
    remoteError: "",
    selectedDate: toISO(today()),
  };

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
    amountPaid: document.getElementById("amountPaid"),
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
    entryCard: document.getElementById("entryCard"),
    exportButton: document.getElementById("exportButton"),
    formModal: document.getElementById("formModal"),
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
    phone: document.getElementById("phone"),
    platform: document.getElementById("platform"),
    prevMonth: document.getElementById("prevMonth"),
    openImportModal: document.getElementById("openImportModal"),
    quickAddButton: document.getElementById("quickAddButton"),
    resetButton: document.getElementById("resetButton"),
    selectedBookings: document.getElementById("selectedBookings"),
    selectedCount: document.getElementById("selectedCount"),
    selectedTitle: document.getElementById("selectedTitle"),
    sourceLegend: document.getElementById("sourceLegend"),
    todayButton: document.getElementById("todayButton"),
    weekdayRow: document.getElementById("weekdayRow"),
  };

  init();

  async function init() {
    els.phone.required = false;
    els.phone.removeAttribute("required");
    state.bookings = loadLocalBookings();
    populateStaticSelects();
    bindEvents();
    resetForm();
    render();

    state.remoteConfig = getSupabaseConfig();
    hydrateRemote().catch((error) => {
      state.remoteError = error.message || String(error);
      console.warn("Willow cloud startup failed", error);
    });
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
      openBookingModal();
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
      await saveBookings();
      resetForm();
      render();
      closeFormModal();
      toast(t("saved"));
    });

    els.resetButton.addEventListener("click", resetForm);
    els.exportButton.addEventListener("click", exportCsv);
    els.importButton.addEventListener("click", importSelectedFile);
    els.openImportModal.addEventListener("click", openImportModal);
    els.notes.addEventListener("input", renderNotePreview);
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
          openAdminPanel();
        } catch (error) {
          els.adminLoginError.textContent = error.message || t("adminLoginError");
          els.adminLoginError.hidden = false;
          els.adminPassword.select();
        }
        return;
      }
      if (username === ADMIN_USERNAME && credentialHash(password) === ADMIN_PASSWORD_HASH) {
        setAdminMode(true);
        closeAdminLogin();
        openAdminPanel();
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
      if (event.key !== "Escape") return;
      if (!els.adminLoginModal.hidden) closeAdminLogin();
      if (!els.adminPanelModal.hidden) closeAdminPanel();
      if (!els.bookingModal.hidden) closeBookingModal();
      if (!els.formModal.hidden) closeFormModal();
      if (!els.importModal.hidden) closeImportModal();
    });
    els.quickAddButton.addEventListener("click", () => {
      resetForm();
      openFormModal();
    });
  }

  function openBookingModal() {
    if (!state.selectedDate) return;
    els.bookingModal.hidden = false;
    syncModalLock();
    requestAnimationFrame(() => els.closeBookingModal.focus({ preventScroll: true }));
  }

  function closeBookingModal() {
    els.bookingModal.hidden = true;
    syncModalLock();
  }

  function openFormModal() {
    if (!state.isAdmin) {
      openAdminLogin();
      toast(t("adminRequired"));
      return;
    }
    els.formModal.hidden = false;
    syncModalLock();
    requestAnimationFrame(() => document.getElementById("guestName").focus({ preventScroll: true }));
  }

  function closeFormModal() {
    els.formModal.hidden = true;
    syncModalLock();
  }

  function openImportModal() {
    if (!state.isAdmin) {
      openAdminLogin();
      toast(t("adminRequired"));
      return;
    }
    els.importModal.hidden = false;
    syncModalLock();
    requestAnimationFrame(() => els.importSource.focus({ preventScroll: true }));
  }

  function closeImportModal() {
    els.importModal.hidden = true;
    syncModalLock();
  }

  function openAdminLogin() {
    els.adminUsername.value = state.remoteConfig?.adminUsername || ADMIN_USERNAME;
    els.adminPassword.value = "";
    els.adminLoginError.textContent = t("adminLoginError");
    els.adminLoginError.hidden = true;
    els.adminLoginModal.hidden = false;
    syncModalLock();
    requestAnimationFrame(() => els.adminPassword.focus({ preventScroll: true }));
  }

  function closeAdminLogin() {
    els.adminLoginModal.hidden = true;
    syncModalLock();
  }

  function openAdminPanel() {
    renderAdminPanel();
    els.adminPanelModal.hidden = false;
    syncModalLock();
    requestAnimationFrame(() => els.closeAdminPanel.focus({ preventScroll: true }));
  }

  function closeAdminPanel() {
    els.adminPanelModal.hidden = true;
    syncModalLock();
  }

  function setAdminMode(isAdmin) {
    state.isAdmin = isAdmin;
    if (!isAdmin) {
      closeFormModal();
      closeImportModal();
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
        persistSession: false,
        detectSessionInUrl: true,
      },
    });
  }

  async function hydrateRemote() {
    if (!state.remoteConfig) return;
    await loadSupabaseLibrary();
    state.remoteClient = createRemoteClient(state.remoteConfig);
    if (!state.remoteClient) return;
    const remoteBookings = await loadBookings();
    state.bookings = remoteBookings;
    render();
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
    state.bookings = await loadBookings();
    render();
  }

  async function signOutAdmin() {
    if (state.remoteClient) {
      await state.remoteClient.auth.signOut();
    }
    setAdminMode(false);
    state.bookings = await loadBookings();
    render();
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
    els.quickAddButton.hidden = true;
    els.openImportModal.hidden = true;
    els.exportButton.hidden = true;
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
      const ariaLabel = `${formatFullDate(iso)}: ${bookings.length}`;

      return `
        <button class="${classes}" type="button" data-date="${iso}" aria-label="${escapeHtml(ariaLabel)}">
          <span class="day-number">${date.getDate()}</span>
          <span class="booking-stack">${bookingPills}${more}</span>
        </button>
      `;
    }).join("");
  }

  function renderCalendarBooking(booking, isoDate) {
    const source = getSource(booking.platform);
    const segment = bookingSegment(booking, isoDate);
    const guest = firstName(booking.guestName) || source.label;
    const guestTotal = Number(booking.adults || 0) + Number(booking.children || 0);
    const guestSuffix = guestTotal > 1 ? ` +${guestTotal - 1}` : "";
    const showLabel = segment === "start" || segment === "same-day";
    const label = `${guest}${guestSuffix}`;
    const initial = guest.charAt(0).toUpperCase();
    const style = segment === "start"
      ? ` style="--booking-width: ${bookingStartWidth(booking, isoDate)}"`
      : "";

    return `
      <span
        class="booking-pill ${source.className} ${segment}"
        title="${escapeAttr(`${booking.guestName} - ${source.label}`)}"
        ${style}
      >
        ${showLabel ? `<span class="booking-avatar">${escapeHtml(initial)}</span>` : ""}
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
          <span class="source-chip ${source.className}">${escapeHtml(source.label)}</span>
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
        if (state.isAdmin && !remoteBookings.length && localBookings.length) {
          await syncRemoteBookings(localBookings);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localBookings));
          return localBookings;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteBookings));
        state.remoteError = "";
        return remoteBookings;
      } catch (error) {
        state.remoteError = error.message || String(error);
        console.warn("Willow cloud sync unavailable", error);
      }
    }
    return localBookings;
  }

  function loadLocalBookings() {
    const stored = localStorage.getItem(STORAGE_KEY);
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
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return [];
  }

  async function saveBookings({ syncRemote = true } = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
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
    return publicRows.map((row) => {
      const privateRow = privateById.get(row.id) || {};
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
    });
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
    await saveBookings();
    render();
    closeImportModal();
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

  function fieldForHeader(header) {
    const normalized = normalizeToken(header);
    const aliases = {
      guestName: ["guestname", "guest", "name", "customername", "customer"],
      phone: ["phone", "phonenumber", "mobile", "mobilenumber", "contact", "contactnumber"],
      platform: ["platform", "source", "bookedthrough", "bookingplatform"],
      bookingId: ["bookingid", "reservationid", "confirmationnumber", "confirmationcode"],
      amountPaid: ["amountpaid", "amount", "paid", "total", "revenue", "price", "bookingamount"],
      checkIn: ["checkin", "checkindate", "arrival", "arrivaldate"],
      checkInTime: ["checkintime", "checkinhour", "starttime"],
      checkOut: ["checkout", "checkoutdate", "departure", "departuredate"],
      checkoutTime: ["checkouttime", "checkouthour", "endtime"],
      arrivalTime: ["arrivaltime", "guestarrivaltime"],
      villaRoom: ["villaroom", "villa", "room", "unit", "listing"],
      adults: ["adults", "adult"],
      children: ["children", "child", "kids"],
      pets: ["pets", "pet", "dog", "dogs", "cat", "cats"],
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
