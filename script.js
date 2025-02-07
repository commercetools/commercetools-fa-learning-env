$(document).ready(function () {
    // Load session data from JSON
    $.getJSON("sessions.json", function (data) {
        const sessions = data.sessions;
        const $accordion = $("#sessionAccordion");

        // Populate Accordion
        sessions.forEach((session, index) => {
            let isActive = index === 0 ? "show" : ""; // Expand only Session 1
            let isButtonActive = index === 0 ? "" : "collapsed"; // Remove collapsed for Session 1
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
                                    <li>
                                        <a href="#" class="session-link" data-session="${session.id}" data-topic="${topic.title}" data-infographic="${topic.infographic || ''}">${topic.title}</a>
                                    </li>
                                `).join('') : ''}
                                <li><a href="#" class="session-link" data-session="${session.id}" data-topic="Quiz">Quiz</a></li>
                                <li><a href="#" class="session-link" data-session="${session.id}" data-topic="Case Study">Case Study</a></li>
                            </ul>
                        </div>
                    </div>
                </div>`;
            $accordion.append(sessionHtml);
        });

        // Auto-Click Session 1 on First Load
        setTimeout(() => {
            $(".session-button[data-session='1']").trigger("click");
        }, 500);

        // Handle Click Events for Sessions (Show Overview in Content Area)
        $(".session-button").click(function () {
            $(".session-button").removeClass("active"); // Remove active class from all
            $(this).addClass("active"); // Add active class to clicked session

            const sessionId = $(this).data("session");
            const session = sessions.find(s => s.id == sessionId);

            if (session) {
                $("#sessionImage").attr("src", session.infographic || "img/default-infographic.png");

                // Update content area with session overview
                $("#contentDisplay").html(`
                    <h3>${session.title}</h3>
                    <p>${session.overview}</p>
                `);

                // Update recommendations for the session
                let recHtml = session.recommendations.map(rec => `
                    <a href="${rec.link}" target="_blank" class="recommendation-link">${rec.title}</a>
                `).join('');
                $("#recommendations").html(recHtml);
            }
        });

        // Handle Click Events for Topics
        $(".session-link").click(function () {
            $(".session-link").removeClass("active-topic"); // Remove active class from all
            $(this).addClass("active-topic"); // Highlight the clicked topic

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

        // Handle Click Events for Recommendations
        $(document).on("click", ".recommendation-link", function () {
            $(".recommendation-link").removeClass("active-recommendation"); // Remove active class
            $(this).addClass("active-recommendation"); // Highlight clicked recommendation
        });
    });

    // Function to Display Current Date
    function updateCurrentDate() {
        const today = new Date();
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        document.getElementById("currentDate").textContent = today.toLocaleDateString('en-US', options);
    }
    updateCurrentDate();

    // Hide modal on page load
    $("#imageModal").hide();

    // Click to enlarge image
    $("#sessionImage").click(function () {
        const src = $(this).attr("src");

        // Prevent showing modal if no valid image is selected
        if (src && src !== "img/default-infographic.png") {
            $("#modalImage").attr("src", src);
            $("#imageModal").fadeIn();
        }
    });

    // Close modal when clicking 'X' or outside
    $("#closeModal, #imageModal").click(function () {
        $("#imageModal").fadeOut();
    });

    // Prevent modal from closing when clicking inside modal content
    $(".modal-content").click(function (e) {
        e.stopPropagation();
    });

    // Load saved notes from localStorage
    if (localStorage.getItem("userNotes")) {
        $("#notesEditor").val(localStorage.getItem("userNotes"));
    }

    // Auto-save Notes every 60 seconds
    setInterval(() => {
        localStorage.setItem("userNotes", $("#notesEditor").val());
    }, 60000);

    // Save Notes on Button Click
    $("#saveNotesBtn").click(function () {
        localStorage.setItem("userNotes", $("#notesEditor").val());

        // Show confirmation message
        $("#saveMessage").fadeIn().delay(2000).fadeOut();
    });
});
