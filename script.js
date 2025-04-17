$(document).ready(function () {
  /********** USER INFO HANDLING **********/
  function updateUserGreeting() {
    const firstName = localStorage.getItem("userFirstName");
    const lastName = localStorage.getItem("userLastName");
    if (firstName && lastName) {
      $("#userGreeting").html(`👋 Hello, <strong>${firstName} ${lastName}</strong>`);
    }
  }

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
  function updateProgress() {
    let totalItems = 0;
    let completedItems = 0;
    
    // Counters for tasks, key decisions, quizzes, and case studies.
    let totalTasks = 0, completedTasks = 0;
    let totalKeyDecisions = 0, completedKeyDecisions = 0;
    let totalQuizzes = 0, completedQuizzes = 0;
    let totalCaseStudies = 0, completedCaseStudies = 0;
    
    sessionsData.sessions.forEach((session) => {
      if (session.tasks) {
        totalItems += session.tasks.length;
        totalTasks += session.tasks.length;
        session.tasks.forEach((task) => {
          if (task.status === "Completed") {
            completedItems++;
            completedTasks++;
          }
        });
      }
      if (session.keyDecisions) {
        totalItems += session.keyDecisions.length;
        totalKeyDecisions += session.keyDecisions.length;
        session.keyDecisions.forEach((decision) => {
          if (decision.status === "Completed") {
            completedItems++;
            completedKeyDecisions++;
          }
        });
      }
      if (session.quiz && session.quiz.trim() !== "") {
        totalItems += 1;
        totalQuizzes++;
        if (session.quizStatus === "Completed") {
          completedItems++;
          completedQuizzes++;
        }
      }
      if (session.case_studies) {
        totalItems += session.case_studies.length;
        totalCaseStudies += session.case_studies.length;
        session.case_studies.forEach((cs) => {
          if (cs.status === "Completed") {
            completedItems++;
            completedCaseStudies++;
          }
        });
      }
    });
    
    let percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    $("#progressBar").css("width", percentage + "%").text(percentage + "%");
    $("#progressDetails").html(
      `<b>Key Decisions:</b> ${completedKeyDecisions}/${totalKeyDecisions} | <b>Case Studies:</b> ${completedCaseStudies}/${totalCaseStudies} | <b>Quizzes:</b> ${completedQuizzes}/${totalQuizzes}`
    );
  }
  
  /********** TASK HANDLING **********/
  let sessionsData = {};

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
          html += `<br /><input type="radio" name="task-${task.taskNumber}-radio-${index}" value="${option}" id="task-${task.taskNumber}-radio-${index}-${optIndex}">
                   <label for="task-${task.taskNumber}-radio-${index}-${optIndex}">${option}</label> `;
        });
        html += `</div>`;
      }
    });
    document.getElementById(containerId).innerHTML = html;
  }

  function submitTask(taskNumber) {
    const session = sessionsData.sessions.find((s) => s.tasks && s.tasks.some((t) => t.taskNumber === taskNumber));
    if (!session) return;
    const task = session.tasks.find((t) => t.taskNumber === taskNumber);
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

    task.responses = responses;
    task.status = "Completed";
    localStorage.setItem("sessionsData", JSON.stringify(sessionsData));

    let taskResponsesHTML = `<div class="task-responses" id="task-responses-${task.taskNumber}">` +
                              `<h5>Task ${task.taskNumber}</h5><ul>`;
    responses.forEach((r) => {
      taskResponsesHTML += `<li>${r.question} - ${r.answer}</li>`;
    });
    taskResponsesHTML += `</ul></div>`;

    let $notesEditor = $("#notesEditor");
    if ($notesEditor.find(`#task-responses-${task.taskNumber}`).length > 0) {
      $notesEditor.find(`#task-responses-${task.taskNumber}`).replaceWith(taskResponsesHTML);
    } else {
      $notesEditor.append(taskResponsesHTML);
    }

    const containerId = `interactive-task-${task.taskNumber}`;
    document.getElementById(containerId).innerHTML =
      `<em>Task Completed. Your responses have been recorded.</em> 
       <a href="#" onclick="reSubmitTask(${task.taskNumber}); return false;">Re-submit</a>`;

    updateProgress();
    alert(`Task ${task.taskNumber} marked as completed!`);
  }

  function reSubmitTask(taskNumber) {
    const session = sessionsData.sessions.find((s) => s.tasks && s.tasks.some((t) => t.taskNumber === taskNumber));
    if (!session) return;
    const task = session.tasks.find((t) => t.taskNumber == taskNumber);
    if (!task) return;
    task.status = "In Progress";
    renderInteractiveElements(task, `interactive-task-${task.taskNumber}`);
    updateProgress();
  }

  window.submitTask = submitTask;
  window.reSubmitTask = reSubmitTask;

  /********** MARK AS DONE FUNCTIONS FOR Quiz and Case Study **********/
  function markQuizDone(sessionId) {
    let session = sessionsData.sessions.find((s) => s.id == sessionId);
    if (!session) return;
    session.quizStatus = "Completed";
    localStorage.setItem("sessionsData", JSON.stringify(sessionsData));
    updateProgress();
    alert("Quiz marked as completed!");
    $(`.session-link[data-session='${sessionId}'][data-type='quiz']`).click();
  }

  function markCaseStudyDone(sessionId, csIndex) {
    let session = sessionsData.sessions.find((s) => s.id == sessionId);
    if (!session) return;
    let cs = session.case_studies[csIndex];
    if (!cs) return;
    cs.status = "Completed";
    localStorage.setItem("sessionsData", JSON.stringify(sessionsData));
    updateProgress();
    alert("Case Study marked as completed!");
    $(`.session-link[data-session='${sessionId}'][data-type='caseStudy'][data-csindex='${csIndex}']`).click();
  }

  /********** LOAD SESSION DATA **********/
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

  function renderSessions() {
    const $accordion = $("#sessionAccordion");
    $accordion.empty();
    sessionsData.sessions.forEach((session, index) => {
      let isActive = index === 0 ? "show" : "";
      let isButtonActive = index === 0 ? "" : "collapsed";

      let tasksHtml = "";
      if (session.tasks) {
        tasksHtml = session.tasks
          .map(
            (task) => `
          <li class="list-group-item">
            <a href="#" class="session-link" data-session="${session.id}" data-type="task" data-tasknumber="${task.taskNumber}">
              Task ${task.taskNumber}: ${task.taskTitle}
            </a>
          </li>`
          )
          .join("");
      }

      let keyDecisionsHtml = "";
      if (session.keyDecisions) {
        keyDecisionsHtml = session.keyDecisions
          .map(
            (decision) => `
          <li class="list-group-item">
            <a href="#" class="session-link" data-session="${session.id}" data-type="keyDecision" data-decisionid="${decision.decisionId}">
            ${decision.decisionId} - ${decision.title}
            </a>
          </li>`
          )
          .join("");
      }

      let caseStudyHtml = "";
      if (session.case_studies && session.case_studies.length) {
        caseStudyHtml = session.case_studies
          .map(
            (cs, idx) => `
          <li class="list-group-item">
            <a href="#" class="session-link" data-session="${session.id}" data-type="caseStudy" data-csindex="${idx}">
              ${cs.title}
            </a>
          </li>`
          )
          .join("");
      }

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
                ${keyDecisionsHtml}
                ${tasksHtml}
                ${caseStudyHtml}
                ${quizHtml}
              </ul>
            </div>
          </div>
        </div>`;
      $accordion.append(sessionHtml);
    });
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
        recHtml = firstSession.recommendations
          .map(
            (rec) => `
          <a href="${rec.link}" target="_blank" class="recommendation-link d-block">${rec.title}</a>`
          )
          .join("");
      }
      $("#solutionContent").html(recHtml);
    }
  }

  /********** SESSION & INTERACTION EVENT HANDLING **********/
  $(document).on("click", ".session-link", function (e) {
    e.preventDefault();
    $(".list-group-item").removeClass("active");
    $(this).parent().addClass("active");

    const sessionId = $(this).data("session");
    const type = $(this).data("type");
    const session = sessionsData.sessions.find((s) => s.id == sessionId);
    if (!session) return;

    if (type === "quiz") {
      let quizStatus = session.quizStatus || "Not Started";
      let mainContentHtml = `<h3>Quiz</h3>`;
      if (session.quiz && session.quiz.trim() !== "") {
        mainContentHtml += `<p><a href="${session.quiz}" target="_blank">Take the Quiz ${sessionId}</a></p>`;
      } else {
        mainContentHtml += `<p>No quiz available.</p>`;
      }
      if (quizStatus === "Completed") {
        mainContentHtml += `<p><em>Quiz Completed.</em></p>`;
      } else {
        mainContentHtml += `<button class="btn btn-success" id="quizDoneBtn">Done</button>`;
      }
      $("#mainContent").html(mainContentHtml);
      $("#solutionContent").html("");
      $("#quizDoneBtn").on("click", function () {
        markQuizDone(sessionId);
      });
    } else if (type === "caseStudy") {
      const csIndex = $(this).data("csindex");
      const cs = session.case_studies[csIndex];
      let csStatus = cs.status || "Not Started";
      let mainContentHtml = `<h3>${cs.title}</h3>`;
      if (cs.description && Array.isArray(cs.description)) {
        cs.description.forEach((item) => {
          if (item.type === "paragraph") {
            mainContentHtml += `<p>${item.content}</p>`;
          } else if (item.type === "list") {
            mainContentHtml += "<ul>";
            item.content.forEach((li) => {
              mainContentHtml += `<li>${li}</li>`;
            });
            mainContentHtml += "</ul>";
          } else if (item.type === "task") {
            mainContentHtml += "<ol>";
            item.content.forEach((li) => {
              mainContentHtml += `<li>${li}</li>`;
            });
            mainContentHtml += "</ol>";
          }
        });
      }
      if (cs.link && cs.link.trim() !== "") {
        mainContentHtml += `<p><a href="${cs.link}" target="_blank">View Case Study Document</a></p>`;
      }
      if (csStatus === "Completed") {
        mainContentHtml += `<p><em>Case Study Completed.</em></p>`;
      } else {
        mainContentHtml += `<button class="btn btn-success" id="caseStudyDoneBtn">Done</button>`;
      }
      $("#mainContent").html(mainContentHtml);
      $("#solutionContent").html("");
      $("#caseStudyDoneBtn").on("click", function () {
        markCaseStudyDone(sessionId, csIndex);
      });
    } else if (type === "task") {
      const taskNumber = $(this).data("tasknumber");
      const task = session.tasks.find((t) => t.taskNumber == taskNumber);
      if (task) {
        let mainContentHtml = `<h3>Task ${task.taskNumber}: ${task.taskTitle}</h3>
                               <p>${task.description || ""}</p>`;
        if (task.infographic && task.infographic.trim() !== "") {
          mainContentHtml += `<img src="${task.infographic}" class="img-fluid" alt="Task Infographic">`;
        }
        mainContentHtml += `<h4></h4>
                            <ul>${(task.notes || []).map((note) => `<li>${note}</li>`).join("")}</ul>`;
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
        if (task.status !== "Completed") {
          renderInteractiveElements(task, `interactive-task-${task.taskNumber}`);
        }
      }
    } else if (type === "keyDecision") {
      const decisionId = $(this).data("decisionid");
      const decision = session.keyDecisions.find((d) => d.decisionId == decisionId);
      if (!decision) return;
      let mainContentHtml = `<h3>${decision.title}</h3>
                             <p>${decision.scenario}</p>`;
      if (decision.status === "Completed") {
        // Use re-submit link with data attributes for event delegation.
        mainContentHtml += `<div id="keyDecision-container-${decision.decisionId}">
                              <em>Key Decision Completed. Your response has been recorded.</em>
                              <a href="#" class="re-submit-link" data-sessionid="${session.id}" data-decisionid="${decision.decisionId}">Re-submit</a>
                           </div>`;
      } else {
        mainContentHtml += `<form id="keyDecisionForm-${decision.decisionId}">`;
        decision.options.forEach((opt, index) => {
          mainContentHtml += `<div class="form-check">
                                <input class="form-check-input" type="radio" name="keydecision-${decision.decisionId}-option" id="keydecision-${decision.decisionId}-option-${index}" value="${index}">
                                <label class="form-check-label" for="keydecision-${decision.decisionId}-option-${index}">${opt.text}</label>
                              </div>`;
        });
        mainContentHtml += `<br/><textarea id="keyDecisionNotes-${decision.decisionId}" class="form-control" placeholder="Enter any additional points or notes to consider..."></textarea>
                            <button type="button" class="btn btn-primary mt-2" onclick="submitKeyDecision(${session.id}, ${decision.decisionId});">Submit</button>
                            </form>`;
      }
      $("#mainContent").html(mainContentHtml);
      $("#solutionContent").html("");
    }
  });

  /********** SUBMIT KEY DECISION FUNCTION **********/
window.submitKeyDecision = function (sessionId, decisionId) {
  const session = sessionsData.sessions.find((s) => s.id == sessionId);
  if (!session) return;
  const decision = session.keyDecisions.find((d) => d.decisionId == decisionId);
  if (!decision) return;
  
  // Prevent duplicate submission
  if (decision.status === "Completed") {
    alert("This key decision has already been submitted.");
    return;
  }
  
  let selectedOptionIndex = $(`input[name='keydecision-${decision.decisionId}-option']:checked`).val();
  if (selectedOptionIndex === undefined) {
    alert("Please select an option");
    return;
  }
  selectedOptionIndex = parseInt(selectedOptionIndex);
  let selectedOption = decision.options[selectedOptionIndex];
  let notes = $(`#keyDecisionNotes-${decision.decisionId}`).val();
  
  // Mark the decision as completed.
  decision.status = "Completed";
  
  let feedbackText = selectedOption.feedback;
  let noteEntry = `<div class="alert alert-info mt-2" id="keyDecision-responses-${decision.decisionId}">
                        <strong>Decision ${decision.decisionId}:</strong><br/>
                        <strong>Scenario:</strong> ${decision.scenario}<br/>
                        <strong>Feedback:</strong> ${feedbackText}<br/>
                        <em>Your notes:</em> ${notes}
                   </div>`;
  
  // Prepend the note (so the latest appears first)
  if ($(`#keyDecision-responses-${decision.decisionId}`).length > 0) {
    $(`#keyDecision-responses-${decision.decisionId}`).replaceWith(noteEntry);
  } else {
    $("#notesEditor").prepend(noteEntry);
  }
  
  // Immediately update localStorage for userNotes
  localStorage.setItem("userNotes", $("#notesEditor").html());
  
  // Replace the form with a completion message and a re-submit link
  $("#mainContent").html(
    `<em>Key Decision Completed. Your response has been recorded.</em>
     <a href="#" onclick="reSubmitKeyDecision(${sessionId}, ${decisionId}); return false;">Re-submit</a>`
  );
  
  localStorage.setItem("sessionsData", JSON.stringify(sessionsData));
  updateProgress();
  alert("Your response has been recorded!");
};

/********** RE-SUBMIT KEY DECISION FUNCTION **********/
window.reSubmitKeyDecision = function (sessionId, decisionId) {
  const session = sessionsData.sessions.find((s) => s.id == sessionId);
  if (!session) return;
  const decision = session.keyDecisions.find((d) => d.decisionId == decisionId);
  if (!decision) return;
  
  // Reset status to allow re-submission.
  decision.status = "In Progress";
  
  // Re-render the key decision form.
  let mainContentHtml = `<h3>${decision.title}</h3>
                           <p>${decision.scenario}</p>
                           <form id="keyDecisionForm-${decision.decisionId}">`;
  decision.options.forEach((opt, index) => {
    mainContentHtml += `<div class="form-check">
                          <input class="form-check-input" type="radio" name="keydecision-${decision.decisionId}-option" id="keydecision-${decision.decisionId}-option-${index}" value="${index}">
                          <label class="form-check-label" for="keydecision-${decision.decisionId}-option-${index}">${opt.text}</label>
                        </div>`;
  });
  mainContentHtml += `<br/><textarea id="keyDecisionNotes-${decision.decisionId}" class="form-control" placeholder="Enter your notes..."></textarea>
                      <button type="button" class="btn btn-primary mt-2" onclick="submitKeyDecision(${sessionId}, ${decision.decisionId});">Submit</button>
                      </form>`;
  
  $("#mainContent").html(mainContentHtml);
  localStorage.setItem("sessionsData", JSON.stringify(sessionsData));
};


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

  window.submitTask = submitTask;
  window.reSubmitTask = reSubmitTask;
});
