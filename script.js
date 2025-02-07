$(document).ready(function () {
    // Load session data from JSON
    $.getJSON("./sessions.json", function (data) {
        const sessions = data.sessions;
        const $accordion = $("#sessionAccordion");

        // Populate Accordion
        sessions.forEach((session, index) => {
            let isActive = index === 0 ? "show" : ""; // Expand only Session 1
            let isButtonActive = index === 0 ? "active" : "collapsed"; // Highlight only Session 1 button

            let sessionHtml = `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button ${isButtonActive} session-button" type="button" data-bs-toggle="collapse" data-bs-target="#session${session.id}" data-session="${session.id}">
                        ${session.id}. ${session.title}
                        </button>
                    </h2>
                    <div id="session${session.id}" class="accordion-collapse collapse ${isActive}" data-bs-parent="#sessionAccordion">
                        <div class="accordion-body">
                            <ul>
                                ${session.topics ? session.topics.map(topic => `
                                    <li class="topic-item">
                                        <a href="#" class="session-link" data-session="${session.id}" data-topic="${topic.title}" data-infographic="${topic.infographic || ''}">${topic.title}</a>
                                    </li>
                                `).join('') : ''}
                                <li class="topic-item"><a href="#" class="session-link" data-session="${session.id}" data-topic="Quiz">Quiz</a></li>
                                <li class="topic-item"><a href="#" class="session-link" data-session="${session.id}" data-topic="Case Study">Case Study</a></li>
                            </ul>
                        </div>
                    </div>
                </div>`;
            $accordion.append(sessionHtml);
        });

        // 🔹 Force-expand Session 1 and show its overview on first load
        setTimeout(() => {
            let firstSession = $("#session1");
            firstSession.addClass("show");
            $(".session-button[data-session='1']").removeClass("collapsed").addClass("active").attr("aria-expanded", "true");

            // Show overview of first session by default
            let firstSessionData = sessions.find(s => s.id == 1);
            if (firstSessionData) {
                $("#contentDisplay").html(`
                    <h3>${firstSessionData.title}</h3>
                    <p>${firstSessionData.overview}</p>
                `);
                $("#sessionImage").attr("src", firstSessionData.infographic || "img/default-infographic.png");
                let recHtml = firstSessionData.recommendations.map(rec => `
                    <a href="${rec.link}" target="_blank" class="recommendation-link">${rec.title}</a>
                `).join('');
                $("#recommendations").html(recHtml);
            }
        }, 500);

        // 🔹 Handle Click Events for Sessions (Highlight Active Session Title)
        $(document).on("click", ".session-button", function () {
            $(".session-button").removeClass("active"); // Remove active class from all
            $(this).addClass("active"); // Highlight the clicked session

            const sessionId = $(this).data("session");
            const session = sessions.find(s => s.id == sessionId);

            if (session) {
                $("#contentDisplay").html(`
                    <h3>${session.title}</h3>
                    <p>${session.overview}</p>
                `);
                $("#sessionImage").attr("src", session.infographic || "img/default-infographic.png");

                // Update recommendations for the session
                let recHtml = session.recommendations.map(rec => `
                    <a href="${rec.link}" target="_blank" class="recommendation-link">${rec.title}</a>
                `).join('');
                $("#recommendations").html(recHtml);
            }
        });

        // 🔹 Handle Click Events for Topics (Highlight Selected Topic)
        $(document).on("click", ".session-link", function () {
            $(".topic-item").removeClass("active-topic"); // Remove active class from all <li>
            $(this).parent().addClass("active-topic"); // Add active class to the clicked <li>

            const sessionId = $(this).data("session");
            const topicTitle = $(this).data("topic");
            const infographic = $(this).data("infographic");

            const session = sessions.find(s => s.id == sessionId);
            if (session) {
                let content = `<h3>${session.title}</h3><p>${session.overview}</p>`;

                if (topicTitle === "Quiz") {
                    content = `<h3>Quiz</h3><p><a href='${session.quiz}' target='_blank'>Take the Quiz</a></p>`;
                } else if (topicTitle === "Case Study") {
                    content = `<h3>Case Study</h3><p><a href='${session.case_study}' target='_blank'>View Case Study</a></p>`;
                } else {
                    if (session.topics) {
                        const topic = session.topics.find(t => t.title === topicTitle);
                        if (topic) {
                            content = `
                                <h3>${topic.title}</h3>
                                <p>${topic.description}</p>
                                <h4>Key Points:</h4>
                                <ul>${topic.notes.map(note => `<li>${note}</li>`).join('')}</ul>
                            `;
                            $("#sessionImage").attr("src", infographic || session.infographic);
                        }
                    }
                }

                $("#contentDisplay").html(content);
            }
        });

        // 🔹 Handle Click Events for Recommendations
        $(document).on("click", ".recommendation-link", function () {
            $(".recommendation-link").removeClass("active-recommendation");
            $(this).addClass("active-recommendation");
        });
    });

    // 🔹 Function to Display Current Date
    function updateCurrentDate() {
        const today = new Date();
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        document.getElementById("currentDate").textContent = today.toLocaleDateString('en-US', options);
    }
    updateCurrentDate();

    // 🔹 Hide modal on page load
    $("#imageModal").hide();

    // 🔹 Click to enlarge image
    $("#sessionImage").click(function () {
        const src = $(this).attr("src");
        if (src && src !== "img/default-infographic.png") {
            $("#modalImage").attr("src", src);
            $("#imageModal").fadeIn();
        }
    });

    // 🔹 Close modal when clicking 'X' or outside
    $("#closeModal, #imageModal").click(function () {
        $("#imageModal").fadeOut();
    });

    // 🔹 Prevent modal from closing when clicking inside modal content
    $(".modal-content").click(function (e) {
        e.stopPropagation();
    });

    // 🔹 Load saved notes from localStorage
    if (localStorage.getItem("userNotes")) {
        $("#notesEditor").val(localStorage.getItem("userNotes"));
    }

    // 🔹 Auto-save Notes every 60 seconds
    setInterval(() => {
        localStorage.setItem("userNotes", $("#notesEditor").val());
    }, 60000);

    // 🔹 Save Notes on Button Click
    $("#saveNotesBtn").click(function () {
        localStorage.setItem("userNotes", $("#notesEditor").val());
        $("#saveMessage").fadeIn().delay(2000).fadeOut();
    });
});
