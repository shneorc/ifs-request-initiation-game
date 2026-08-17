/* =============================================================================
 * content.js  —  ALL learning + quiz content lives here.
 * Non-developers can safely edit the text/answers below.
 *
 * FIDELITY NOTE:
 *  - "verified"  = concept appears in the IFS Request Initiation process model
 *                  (Create New Request / Modify / Release / Warranty / Service
 *                  Commercial Rule are named sub-processes on the source page).
 *  - "illustrative" = simplified example data (customer names, asset IDs, etc.)
 *                  invented for gameplay. Replace with your real docs content.
 *  - Anything you should confirm is tagged with  // TODO: verify
 * ========================================================================== */

const GAME = {
  meta: {
    title: "Request Initiation",
    subtitle: "Create New Request — Interactive Learning POC",
    source: "IFS Cloud 26R1 · Service Management · 6.12 Request Initiation",
    sourceUrl:
      "https://docs.ifs.com/ifsclouddocs/26r1/ProcessModels/Process_Model/Requestinitiation.htm"
  },

  /* -------------------------------------------------------------------------
   * STAGES — the van stops at each one. Points are awarded per correct action.
   * ---------------------------------------------------------------------- */
  stages: [
    {
      id: "customer",
      name: "Identify the Customer",
      icon: "👤",
      points: 100,
      teach:
        "Every service request starts with the <b>customer (business partner)</b> who reported the need. Selecting the correct customer links the request to the right account, contacts, contracts and pricing.",
      task: {
        type: "pick",
        prompt:
          "A caller says: “Hi, this is Nora from <b>Riverside Manufacturing</b>, our pump is leaking.” Pick the correct customer record.",
        options: [
          { label: "Riverside Manufacturing", correct: true },
          { label: "Riverside Logistics", correct: false },
          { label: "Rivertown Facilities", correct: false }
        ],
        feedbackRight:
          "Correct — the request is now attached to Riverside Manufacturing.",
        feedbackWrong:
          "Not quite. Match the caller’s company name exactly before continuing."
      }
    },

    {
      id: "details",
      name: "Capture Request Details",
      icon: "📝",
      points: 150,
      teach:
        "Next, capture <b>what</b> the customer needs. A <b>Request Type</b> classifies the work (e.g. Corrective, Preventive, Installation) and the <b>Priority</b> drives urgency and scheduling. A clear reported problem helps the technician prepare.", // TODO: verify exact request-type values in your docs
      task: {
        type: "twopick",
        prompt:
          "The pump is leaking and stopping production. Choose the best <b>Request Type</b> and <b>Priority</b>.",
        groups: [
          {
            label: "Request Type",
            options: [
              { label: "Corrective", correct: true },
              { label: "Preventive", correct: false },
              { label: "Installation", correct: false }
            ]
          },
          {
            label: "Priority",
            options: [
              { label: "Low", correct: false },
              { label: "Medium", correct: false },
              { label: "High", correct: true }
            ]
          }
        ],
        feedbackRight:
          "Spot on — a breakdown affecting production is Corrective + High priority.",
        feedbackWrong:
          "Reconsider: the fault has stopped production, so it is corrective and urgent."
      }
    },

    {
      id: "object",
      name: "Link the Service Object",
      icon: "⚙️",
      points: 150,
      teach:
        "Link the request to the <b>service object</b> — the equipment, functional object or <b>serial object</b> being serviced. This connects history, warranty and specifications to the request.",
      task: {
        type: "drag",
        prompt:
          "Drag the correct asset onto the request. The fault is a leaking <b>centrifugal pump, serial PMP-2207</b>.",
        target: "Request #RQ-0098",
        options: [
          { label: "Pump PMP-2207", correct: true },
          { label: "Conveyor CNV-1140", correct: false },
          { label: "Boiler BLR-3301", correct: false }
        ],
        feedbackRight:
          "Linked. The pump’s full service history is now visible on the request.",
        feedbackWrong: "That asset doesn’t match serial PMP-2207. Try again."
      }
    },

    {
      id: "warranty",
      name: "Warranty & Commercial Rule",
      icon: "🛡️",
      points: 150,
      teach:
        "Before releasing, check the <b>warranty</b> and any <b>service commercial rule</b>. These decide whether the work is <b>covered</b> (no charge) or <b>chargeable</b> to the customer, and which price rules apply.",
      task: {
        type: "decision",
        prompt:
          "Pump PMP-2207 was installed <b>8 months ago</b> with a <b>12-month warranty</b>, and the fault is a manufacturing defect. Is this work covered?",
        options: [
          { label: "Covered under warranty", correct: true },
          { label: "Chargeable to customer", correct: false }
        ],
        feedbackRight:
          "Correct — within the 12-month warranty and a covered defect, so no charge.",
        feedbackWrong:
          "Check the dates: 8 months is inside the 12-month warranty for a covered defect."
      }
    },

    {
      id: "release",
      name: "Save & Release Request",
      icon: "🚀",
      points: 150,
      teach:
        "Finally, <b>save</b> the request and <b>release</b> it. Releasing moves it out of preparation and generates the <b>work task</b> that can be scheduled and allocated to a resource.",
      task: {
        type: "order",
        prompt:
          "Put the final steps in the correct order to complete Request Initiation.",
        steps: [
          "Review the captured details",
          "Save the request",
          "Release the request",
          "Work task is generated for scheduling"
        ],
        feedbackRight:
          "Perfect flow — the request is released and a work task is ready to schedule.",
        feedbackWrong: "Almost — review, save, release, then the task is generated."
      }
    }
  ],

  /* -------------------------------------------------------------------------
   * FINAL QUIZ — 6 quick questions drawn from the stages above.
   * ---------------------------------------------------------------------- */
  quiz: {
    pointsPerQuestion: 50,
    questions: [
      {
        q: "What is the first thing you identify when creating a new request?",
        options: [
          "The technician",
          "The customer / business partner",
          "The invoice",
          "The spare part"
        ],
        answer: 1
      },
      {
        q: "Which field classifies the kind of work being requested?",
        options: ["Priority", "Request Type", "Location", "Serial"],
        answer: 1
      },
      {
        q: "A breakdown that halts production should typically be…",
        options: [
          "Preventive, Low",
          "Installation, Medium",
          "Corrective, High",
          "Corrective, Low"
        ],
        answer: 2
      },
      {
        q: "Linking the service object to a request mainly gives you…",
        options: [
          "The customer’s email",
          "Asset history, warranty and specifications",
          "The weather forecast",
          "A discount code"
        ],
        answer: 1
      },
      {
        q: "What determines if the work is covered or chargeable?",
        options: [
          "The technician’s mood",
          "Warranty and service commercial rule",
          "The time of day",
          "The request number"
        ],
        answer: 1
      },
      {
        q: "What does releasing the request produce?",
        options: [
          "A new customer",
          "A work task for scheduling",
          "A warranty claim only",
          "Nothing"
        ],
        answer: 1
      }
    ]
  }
};
