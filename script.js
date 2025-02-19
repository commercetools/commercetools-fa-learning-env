$(document).ready(function () {
  /********** USER INFO HANDLING **********/
  // Updates the navbar with the user's name
  function updateUserGreeting() {
    const firstName = localStorage.getItem("userFirstName");
    const lastName = localStorage.getItem("userLastName");
    if (firstName && lastName) {
      $("#userGreeting").html(`👋 Hello, <strong>${firstName} ${lastName}</strong>`);
    }
  }

  // Checks if user info is stored; if not, shows the modal
  function checkUserInfo() {
    if (
      !localStorage.getItem("userFirstName") ||
      !localStorage.getItem("userLastName") ||
      !localStorage.getItem("userEmail")
    ) {
      $("#userInfoModal").modal("show");
    } else {
      updateUserGreeting();
    }
  }

  // Handle user info form submission
  $("#userInfoForm").submit(function (event) {
    event.preventDefault();
    const firstName = $("#firstName").val().trim();
    const lastName = $("#lastName").val().trim();
    const email = $("#email").val().trim();
    localStorage.setItem("userFirstName", firstName);
    localStorage.setItem("userLastName", lastName);
    localStorage.setItem("userEmail", email);
    updateUserGreeting();
    $("#userInfoModal").modal("hide");
  });

  checkUserInfo();

  /********** PROGRESS TRACKING **********/
  // Calculates the overall progress percentage across all tasks and updates the progress bar.
  function updateProgress() {
    let totalTasks = 0;
    let completedTasks = 0;
    sessionsData.sessions.forEach(session => {
      if (session.tasks) {
        totalTasks += session.tasks.length;
        session.tasks.forEach(task => {
          if (task.status === "Completed") {
            completedTasks++;
          }
        });
      }
    });
    let percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    $("#progressBar").css("width", percentage + "%").text(percentage + "%");
  }

  /********** TASK HANDLING **********/
  let sessionsData = {};

  // Renders interactive input elements based on the task's interactiveElements array
  function renderInteractiveElements(task, containerId) {
    let html = "";
    task.interactiveElements.forEach((element, index) => {
      if (element.type === "text") {
        html += `<div class="mb-2">
                   <label>${element.question}</label>
                   <input type="text" id="task-${task.taskNumber}-input-${index}" class="form-control">
                 </div>`;
      } else if (element.type === "textarea") {
        html += `<div class="mb-2">
                   <label>${element.question}</label>
                   <textarea id="task-${task.taskNumber}-input-${index}" class="form-control"></textarea>
                 </div>`;
      } else if (element.type === "radio") {
        html += `<div class="mb-2"><label>${element.question}</label><br>`;
        element.options.forEach((option, optIndex) => {
          html += `<input type="radio" name="task-${task.taskNumber}-radio-${index}" value="${option}" id="task-${task.taskNumber}-radio-${index}-${optIndex}">
                   <label for="task-${task.taskNumber}-radio-${index}-${optIndex}">${option}</label> `;
        });
        html += `</div>`;
      }
      // Additional input types (checkbox, etc.) can be added here
    });
    document.getElementById(containerId).innerHTML = html;
  }

  // Submits the task responses: captures inputs, updates task status, and appends responses to the notes section.
  function submitTask(taskNumber) {
    // Find the session and task corresponding to the taskNumber
    const session = sessionsData.sessions.find(s => s.tasks && s.tasks.some(t => t.taskNumber === taskNumber));
    if (!session) return;
    const task = session.tasks.find(t => t.taskNumber === taskNumber);
    if (!task) return;

    let responses = [];
    task.interactiveElements.forEach((element, index) => {
      let response = "";
      if (element.type === "text" || element.type === "textarea") {
        response = document.getElementById(`task-${task.taskNumber}-input-${index}`).value;
      } else if (element.type === "radio") {
        let radios = document.getElementsByName(`task-${task.taskNumber}-radio-${index}`);
        for (let radio of radios) {
          if (radio.checked) {
            response = radio.value;
            break;
          }
        }
      }
      responses.push({ question: element.question, answer: response });
    });

    // Update task object with responses and mark as completed
    task.responses = responses;
    task.status = "Completed";

    // Append each response to the task's notes (each on a new line)
    responses.forEach(r => {
      task.notes.push(`${r.question} - ${r.answer}`);
    });

    // Save updated sessions data to localStorage
    localStorage.setItem("sessionsData", JSON.stringify(sessionsData));

    // Create a task responses block to be appended in the overall notes section
    let taskResponsesHTML = `<div class="task-responses" id="task-responses-${task.taskNumber}">` +
                              `<h5>Task ${task.taskNumber} Responses:</h5><ul>`;
    responses.forEach(r => {
      taskResponsesHTML += `<li>${r.question} - ${r.answer}</li>`;
    });
    taskResponsesHTML += `</ul></div>`;
    let $notesEditor = $("#notesEditor");
    if ($notesEditor.find(`#task-responses-${task.taskNumber}`).length > 0) {
      $notesEditor.find(`#task-responses-${task.taskNumber}`).replaceWith(taskResponsesHTML);
    } else {
      $notesEditor.append(taskResponsesHTML);
    }

    // Hide interactive elements and show a "Re-submit" link
    const containerId = `interactive-task-${task.taskNumber}`;
    document.getElementById(containerId).innerHTML =
      `<em>Task Completed. Your responses have been recorded.</em> <a href="#" onclick="reSubmitTask(${task.taskNumber}); return false;">Re-submit</a>`;

    updateProgress();
    alert(`Task ${task.taskNumber} marked as completed!`);
  }

  // Allows the participant to re-submit a task, re-rendering the interactive inputs.
  function reSubmitTask(taskNumber) {
    const session = sessionsData.sessions.find(s => s.tasks && s.tasks.some(t => t.taskNumber === taskNumber));
    if (!session) return;
    const task = session.tasks.find(t => t.taskNumber === taskNumber);
    if (!task) return;
    task.status = "In Progress"; // Reset status for re-submission
    renderInteractiveElements(task, `interactive-task-${task.taskNumber}`);
    updateProgress();
  }

  // Expose functions to the global scope for use in onclick handlers
  window.submitTask = submitTask;
  window.reSubmitTask = reSubmitTask;

  /********** LOAD SESSION DATA **********/
  // Check if sessions data is stored in localStorage, else load from sessions.json
  if (localStorage.getItem("sessionsData")) {
    sessionsData = JSON.parse(localStorage.getItem("sessionsData"));
    renderSessions();
    updateProgress();
  } else {
    $.getJSON("./sessions.json", function (data) {
      sessionsData = data;
      localStorage.setItem("sessionsData", JSON.stringify(data));
      renderSessions();
      updateProgress();
    });
  }

  // Function to render the sessions into the accordion
  function renderSessions() {
    const $accordion = $("#sessionAccordion");
    $accordion.empty();
    sessionsData.sessions.forEach((session, index) => {
      let isActive = index === 0 ? "show" : "";
      let isButtonActive = index === 0 ? "active" : "collapsed";

      // Build tasks list items for this session
      let tasksHtml = "";
      if (session.tasks) {
        tasksHtml = session.tasks.map(task => `
          <li class="list-group-item">
            <a href="#" class="session-link" data-session="${session.id}" data-type="task" data-tasknumber="${task.taskNumber}">
              Task ${task.taskNumber}: ${task.taskTitle}
            </a>
          </li>
        `).join('');
      }

      // Build case studies list items
      let caseStudyHtml = "";
      if (session.case_studies && session.case_studies.length) {
        caseStudyHtml = session.case_studies.map((cs, idx) => `
          <li class="list-group-item">
            <a href="#" class="session-link" data-session="${session.id}" data-type="caseStudy" data-csindex="${idx}">
              ${cs.title}
            </a>
          </li>
        `).join('');
      }

      // Build quiz link list item
      let quizHtml = "";
      if (session.quiz && session.quiz.trim() !== "") {
        quizHtml = `<li class="list-group-item">
                      <a href="#" class="session-link" data-session="${session.id}" data-type="quiz">
                        Session ${session.id} Quiz
                      </a>
                    </li>`;
      }

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
    // Render first session overview by default
    if (sessionsData.sessions.length > 0) {
      let firstSession = sessionsData.sessions[0];
      let mainContentHtml = `<h3>${firstSession.title}</h3>
                             <p>${firstSession.overview}</p>`;
      if (firstSession.infographic && firstSession.infographic.trim() !== "") {
        mainContentHtml += `<img src="${firstSession.infographic}" class="img-fluid" alt="Session Infographic">`;
      }
      $("#mainContent").html(mainContentHtml);

      let recHtml = "";
      if (firstSession.recommendations && firstSession.recommendations.length > 0) {
        recHtml = firstSession.recommendations.map(rec => `
          <a href="${rec.link}" target="_blank" class="recommendation-link d-block">${rec.title}</a>
        `).join('');
      }
      $("#solutionContent").html(recHtml);
    }
  }

  /********** SESSION & TASK EVENT HANDLING **********/
  // When a session header is clicked, update main content and recommendations
  $(document).on("click", ".session-button", function () {
    $(".session-button").removeClass("active");
    $(this).addClass("active");

    const sessionId = $(this).data("session");
    const session = sessionsData.sessions.find(s => s.id == sessionId);
    if (session) {
      let mainContentHtml = `<h3>${session.title}</h3>
                             <p>${session.overview}</p>`;
      if (session.infographic && session.infographic.trim() !== "") {
        mainContentHtml += `<img src="${session.infographic}" class="img-fluid" alt="Session Infographic">`;
      }
      $("#mainContent").html(mainContentHtml);

      let recHtml = "";
      if (session.recommendations && session.recommendations.length > 0) {
        recHtml = session.recommendations.map(rec => `
          <a href="${rec.link}" target="_blank" class="recommendation-link d-block">${rec.title}</a>
        `).join('');
      }
      $("#solutionContent").html(recHtml);
    }
  });

  // When a task link is clicked, render interactive elements or show completed message
  $(document).on("click", ".session-link", function (e) {
    e.preventDefault();
    $(".list-group-item").removeClass("active");
    $(this).parent().addClass("active");

    const sessionId = $(this).data("session");
    const type = $(this).data("type");
    const session = sessionsData.sessions.find(s => s.id == sessionId);
    if (!session) return;

    if (type === "quiz") {
      if (session.quiz && session.quiz.trim() !== "") {
        $("#mainContent").html(`<h3>Quiz</h3><p><a href="${session.quiz}" target="_blank">Take the Quiz ${sessionId}</a></p>`);
      } else {
        $("#mainContent").html(`<h3>Quiz</h3><p>No quiz available.</p>`);
      }
      $("#solutionContent").html('');
    } else if (type === "caseStudy") {
      const csIndex = $(this).data("csindex");
      const cs = session.case_studies[csIndex];
      let mainContentHtml = `<h3>${cs.title}</h3>`;
      if (cs.link && cs.link.trim() !== "") {
        mainContentHtml += `<p>${cs.description}</p>`;
        mainContentHtml += `<p><a href="${cs.link}" target="_blank">View Case Study Document</a></p>`;
      }
      $("#mainContent").html(mainContentHtml);
      $("#solutionContent").html('');
    } else if (type === "task") {
      const taskNumber = $(this).data("tasknumber");
      const task = session.tasks.find(t => t.taskNumber == taskNumber);
      if (task) {
        let mainContentHtml = `<h3>Task ${task.taskNumber}: ${task.taskTitle}</h3>
                               <p>${task.description}</p>`;
        if (task.infographic && task.infographic.trim() !== "") {
          mainContentHtml += `<img src="${task.infographic}" class="img-fluid" alt="Task Infographic">`;
        }
        mainContentHtml += `<h4></h4>
                            <ul>${task.notes.map(note => `<li>${note}</li>`).join('')}</ul>`;
  
        // Check task status to decide whether to render inputs or show a completion message
        if (task.status === "Completed") {
          mainContentHtml += `<div id="interactive-task-${task.taskNumber}" class="mt-3">
                                <em>Task Completed. Your responses have been recorded.</em>
                                <a href="#" onclick="reSubmitTask(${task.taskNumber}); return false;">Re-submit</a>
                              </div>`;
        } else {
          mainContentHtml += `<div id="interactive-task-${task.taskNumber}" class="mt-3"></div>
                              <button class="btn btn-primary mt-2" onclick="submitTask(${task.taskNumber})">Submit Task ${task.taskNumber}</button>`;
        }
  
        $("#mainContent").html(mainContentHtml);
  
        // Only render interactive elements if task is not completed
        if (task.status !== "Completed") {
          renderInteractiveElements(task, `interactive-task-${task.taskNumber}`);
        }
      }
    }
  });

  /********** DISPLAY CURRENT DATE **********/
  function updateCurrentDate() {
    const today = new Date();
    const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
    $("#currentDate").text(today.toLocaleDateString("en-US", options));
  }
  updateCurrentDate();

  /********** NOTES SECTION HANDLING **********/
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

  /********** TEXT FORMATTING FUNCTION **********/
  window.formatText = function (command) {
    document.execCommand(command, false, null);
  };

  /********** EXPOSE TASK FUNCTIONS **********/
  window.submitTask = submitTask;
  window.reSubmitTask = reSubmitTask;
});
