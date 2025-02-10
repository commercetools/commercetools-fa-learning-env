$(document).ready(function () {
    // Load session data from JSON
    $.getJSON("./sessions.json", function (data) {
      const sessions = data.sessions;
      const $accordion = $("#sessionAccordion");
  
      // Populate Accordion with sessions, their tasks, case studies, and quiz link.
      sessions.forEach((session, index) => {
        let isActive = index === 0 ? "show" : "";
        let isButtonActive = index === 0 ? "active" : "collapsed";
  
        // Build tasks list items
        let tasksHtml = "";
        if (session.tasks) {
          tasksHtml = session.tasks.map(task => `
            <li class="list-group-item">
              <a href="#"
                 class="session-link"
                 data-session="${session.id}"
                 data-type="task"
                 data-tasknumber="${task.taskNumber}">
                Task ${task.taskNumber}: ${task.taskTitle}
              </a>
            </li>
          `).join('');
        }
  
        // Build case studies list items (without a header label)
        let caseStudyHtml = "";
        if (session.case_studies && session.case_studies.length) {
          caseStudyHtml = session.case_studies.map((cs, idx) => `
            <li class="list-group-item">
              <a href="#"
                 class="session-link"
                 data-session="${session.id}"
                 data-type="caseStudy"
                 data-csindex="${idx}">
                ${cs.title}
              </a>
            </li>
          `).join('');
        }
  
        // Quiz link list item (only if a quiz link is provided)
        let quizHtml = "";
        if (session.quiz && session.quiz.trim() !== "") {
          quizHtml = `<li class="list-group-item">
                        <a href="#" class="session-link" data-session="${session.id}" data-type="quiz">
                          Session ${session.id} Quiz 
                        </a>
                      </li>`;
        }
  
        // Build the complete accordion item for the session
        let sessionHtml = `
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button ${isButtonActive} session-button" type="button" data-bs-toggle="collapse" data-bs-target="#session${session.id}" data-session="${session.id}">
                ${session.id}. ${session.title}
              </button>
            </h2>
            <div id="session${session.id}" class="accordion-collapse collapse ${isActive}" data-bs-parent="#sessionAccordion">
              <div class="accordion-body">
                <ul class="list-group">
                  ${tasksHtml}
                  ${caseStudyHtml}
                  ${quizHtml}
                </ul>
              </div>
            </div>
          </div>`;
        $accordion.append(sessionHtml);
      });
  
      // Show first session overview by default
      setTimeout(() => {
        let firstSession = sessions[0];
        if (firstSession) {
          let mainContentHtml = `<h3>${firstSession.title}</h3>
                                 <p>${firstSession.overview}</p>`;
          if (firstSession.infographic && firstSession.infographic.trim() !== "") {
            mainContentHtml += `<img src="${firstSession.infographic}" class="img-fluid" alt="Session Infographic">`;
          }
          $("#mainContent").html(mainContentHtml);
  
          let recHtml = "";
          if (firstSession.recommendations && firstSession.recommendations.length > 0) {
            recHtml += `<h5>Recommendations</h5>`;
            recHtml += firstSession.recommendations.map(rec => `
              <a href="${rec.link}" target="_blank" class="recommendation-link d-block">${rec.title}</a>
            `).join('');
          }
          $("#solutionContent").html(recHtml);
        }
      }, 500);
  
      // Handle click on session header (accordion button)
      $(document).on("click", ".session-button", function () {
        $(".session-button").removeClass("active");
        $(this).addClass("active");
  
        const sessionId = $(this).data("session");
        const session = sessions.find(s => s.id == sessionId);
  
        if (session) {
          let mainContentHtml = `<h3>${session.title}</h3>
                                 <p>${session.overview}</p>`;
          if (session.infographic && session.infographic.trim() !== "") {
            mainContentHtml += `<img src="${session.infographic}" class="img-fluid" alt="Session Infographic">`;
          }
          $("#mainContent").html(mainContentHtml);
  
          let recHtml = "";
          if (session.recommendations && session.recommendations.length > 0) {
            recHtml += `<h5>Recommendations</h5>`;
            recHtml += session.recommendations.map(rec => `
              <a href="${rec.link}" target="_blank" class="recommendation-link d-block">${rec.title}</a>
            `).join('');
          }
          $("#solutionContent").html(recHtml);
        }
      });
  
      // Handle click events for links in the accordion list items.
      $(document).on("click", ".session-link", function (e) {
        e.preventDefault();
        // Highlight the selected list item (task, case study, or quiz)
        $(".list-group-item").removeClass("active");
        $(this).parent().addClass("active");
  
        const sessionId = $(this).data("session");
        const type = $(this).data("type");
        const session = sessions.find(s => s.id == sessionId);
        if (!session) return;
  
        if (type === "quiz") {
          if (session.quiz && session.quiz.trim() !== "") {
            $("#mainContent").html(`
              <h3>Quiz</h3>
              <p><a href="${session.quiz}" target="_blank">Take the Quiz ${sessionId}</a></p>
            `);
          } else {
            $("#mainContent").html(`<h3>Quiz</h3><p>No quiz available.</p>`);
          }
          $("#solutionContent").html('');
        } else if (type === "caseStudy") {
          const csIndex = $(this).data("csindex");
          const cs = session.case_studies[csIndex];
          let mainContentHtml = `<h3>${cs.title}</h3>`;
          if (cs.link && cs.link.trim() !== "") {
            mainContentHtml += `<p><a href="${cs.link}" target="_blank">View Case Study</a></p>`;
          }
          $("#mainContent").html(mainContentHtml);
          $("#solutionContent").html('');
        } else if (type === "task") {
          const taskNumber = $(this).data("tasknumber");
          const task = session.tasks.find(t => t.taskNumber == taskNumber);
          if (task) {
            let mainContentHtml = `<h3>Task ${task.taskNumber}:${task.taskTitle}</h3>
                                   <p>${task.description}</p>`;
            if (task.infographic && task.infographic.trim() !== "") {
              mainContentHtml += `<img src="${task.infographic}" class="img-fluid" alt="Task Infographic">`;
            }
            if (task.notes && task.notes.length > 0) {
              mainContentHtml += `<h4>Key Points:</h4>
                                  <ul>${task.notes.map(note => `<li>${note}</li>`).join('')}</ul>`;
            }
            $("#mainContent").html(mainContentHtml);
  
            let solutionHtml = "";
            if ((task.solutionTitle && task.solutionTitle.trim() !== "") ||
                (task.solutionDescription && task.solutionDescription.trim() !== "") ||
                (task.solutionRefLink && task.solutionRefLink.trim() !== "")) {
              if (task.solutionTitle && task.solutionTitle.trim() !== "") {
                solutionHtml += `<h4>${task.solutionTitle}</h4>`;
              }
              if (task.solutionDescription && task.solutionDescription.trim() !== "") {
                solutionHtml += `<p>${task.solutionDescription}</p>`;
              }
              if (task.solutionRefLink && task.solutionRefLink.trim() !== "") {
                solutionHtml += `<p><a href="${task.solutionRefLink}" target="_blank">Learn More</a></p>`;
              }
            }
            if (session.recommendations && session.recommendations.length > 0) {
              solutionHtml += `<hr /><h5>Recommendations</h5>`;
              solutionHtml += session.recommendations.map(rec => `
                <a href="${rec.link}" target="_blank" class="recommendation-link d-block">${rec.title}</a>
              `).join('');
            }
            $("#solutionContent").html(solutionHtml);
          }
        }
      });
    });
  
    // Display the current date in the navbar.
    function updateCurrentDate() {
      const today = new Date();
      const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
      $("#currentDate").text(today.toLocaleDateString("en-US", options));
    }
    updateCurrentDate();
  
    // --- Notes Section Handling ---
    if (localStorage.getItem("userNotes")) {
      $("#notesEditor").html(localStorage.getItem("userNotes"));
    }
  
    setInterval(() => {
      localStorage.setItem("userNotes", $("#notesEditor").html());
    }, 60000);
  
    $("#saveNotesBtn").click(function () {
      localStorage.setItem("userNotes", $("#notesEditor").html());
      $("#saveMessage").fadeIn().delay(2000).fadeOut();
    });
  
    window.formatText = function (command) {
      document.execCommand(command, false, null);
    };
  });
  