(function () {
  "use strict";

  const GOOGLE_SHEETS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxkWIniQEotoD-wN2YRszxZv5lqUU-VIv0MzS0OG8vAkekKbcr3BEk_obldIjuEdb5W/exec";

  function showNotice(message) {
    $("#notif-submt").remove();
    $("#push_ucapan").after(
      $("<p>", { id: "notif-submt" })
        .css({
          lineHeight: "14px",
          fontWeight: 200,
          fontSize: "12px",
          marginTop: "20px",
          backgroundColor: "#fff8d5",
          borderRadius: "5px",
          color: "#3b3b3b",
          padding: "5px",
        })
        .text(message),
    );
    window.setTimeout(function () {
      $("#notif-submt").remove();
    }, 7000);
  }

  function loadUcapanFromSheet() {
    const callbackName =
      "ucapanSheet_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    const script = document.createElement("script");
    let finished = false;
    const timeoutId = window.setTimeout(cleanup, 10000);

    function cleanup() {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      if (script.parentNode) script.parentNode.removeChild(script);
      try {
        delete window[callbackName];
      } catch (error) {
        window[callbackName] = undefined;
      }
    }

    window[callbackName] = function (items) {
      const html = (Array.isArray(items) ? items : []).map(function (item) {
        const attending = item.kehadiran === "Hadir" || item.ket_hadir === "1";
        const hadir = attending
          ? "Hadir (" + (item.jumlah || "0") + " orang)"
          : "Tidak hadir";
        return $("<div>")
          .addClass("ucapan-lokal-item")
          .css({
            padding: "12px",
            margin: "8px",
            borderBottom: "1px solid #ddd",
          })
          .append(
            $("<strong>").text(item.nama || "Tamu"),
            $("<small>")
              .css({ display: "block", color: "#777" })
              .text(hadir + (item.waktu ? " - " + item.waktu : "")),
            $("<p>")
              .css({ margin: "6px 0 0" })
              .text(item.ucapan || ""),
          );
      });
      $("#box_ucapan").empty().append(html);
      cleanup();
    };

    script.onerror = function () {
      cleanup();
      $("#box_ucapan").text(
        "Ucapan belum dapat dimuat. Silakan muat ulang halaman.",
      );
    };
    script.src =
      GOOGLE_SHEETS_WEB_APP_URL +
      "?callback=" +
      encodeURIComponent(callbackName);
    document.head.appendChild(script);
  }

  function bindSheetGuestbook() {
    const $form = $("#push_ucapan");
    if (!$form.length) return;

    // Remove the legacy localStorage-only submit listener.
    $form.off("submit");
    $form.on("submit", function (event) {
      event.preventDefault();
      const nama = String($("#konfir_nama_2").val() || "").trim();
      const ucapan = String($("#ucapan_2").val() || "").trim();
      const ketHadir = $("#hadir_id").val();
      const jumlah = $("#jumlah_datang_id").val();

      if (!nama || !ketHadir) {
        this.reportValidity();
        return;
      }

      const $button = $("#tombol_kirim_2");
      const originalText = $button.text();
      $button.prop("disabled", true).text("Mengirim...");

      fetch(GOOGLE_SHEETS_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({
          nama: nama,
          ucapan: ucapan || "Tidak ada ucapan.",
          ket_hadir: ketHadir,
          jumlah: ketHadir === "1" ? jumlah : "0",
        }),
      })
        .then(function () {
          // With no-cors, the browser cannot verify whether Apps Script saved the row.
          localStorage.setItem("isiUcapan", "true");
          localStorage.setItem(
            "ucapanForm-988128-Gunawan+FG+dan+Patner",
            "true",
          );
          $("#ucapan_2").val("");
          showNotice(
            "Permintaan ucapan telah dikirim. Periksa Google Sheet untuk memastikan data tersimpan.",
          );
          if (typeof isUserFilledKehadiranForm === "function")
            isUserFilledKehadiranForm();
          window.setTimeout(loadUcapanFromSheet, 1500);
        })
        .catch(function () {
          showNotice(
            "Pengiriman gagal. Periksa koneksi internet lalu coba lagi.",
          );
        })
        .finally(function () {
          $button.prop("disabled", false).text(originalText || "Kirim");
        });
    });
  }

  // This shared script is included at the end of each generated invitation page.
  if (window.jQuery) {
    jQuery(function () {
      bindSheetGuestbook();
      loadUcapanFromSheet();
    });
  }
  window.loadUcapan = loadUcapanFromSheet;
})();
