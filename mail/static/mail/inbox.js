document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


// Submit email
document.addEventListener('DOMContentLoaded', function() {

  const recipients = document.querySelector('#compose-recipients');
  const subject = document.querySelector('#compose-subject');
  const body = document.querySelector('#compose-body');

  document.querySelector('#compose-form').addEventListener('click', (e) => {
    e.preventDefault();

    if (e.target.type === 'submit'){
      fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients.value,
            subject: subject.value,
            body: body.value
        })
      })
      .then(response => response.json())
      .then(result => {
          // Print result
          console.log(result);
          load_mailbox('sent');
      });
    }
  })
})


// List emails (eventlistener will call this function to load the messages)
function load_mailbox (mailbox = 'inbox') {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // List the emails
  listEmails(mailbox);

  // View mail
  viewMail();
}


// List the emails function
function listEmails(mailbox) {
  const view = document.querySelector('#emails-view');
  // Create elements
  const div = document.createElement('div');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const tr = document.createElement('tr');
  
  // Add classes
  div.classList.add('mailbox', 'table-responsive');
  table.classList.add('table');

  // Append elements
  view.append(div);
  div.append(table);

  // Create table header
  let labels = [];
  if (mailbox === 'inbox' || mailbox === 'archive') {
    labels = ['Sender', 'Subject', 'Date and Time'];
  }

  if (mailbox === 'sent') {
    labels = ['Recipient', 'Subject', 'Date and Time'];
  }

  for (let i = 0; i < labels.length; i++) {
    const th = document.createElement('th');
    th.innerHTML = labels[i];
    tr.append(th);
  }
  
  thead.append(tr);
  table.append(thead);
  table.append(tbody);


  // Load emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print email
    if (emails.length === 0){
      tbody.innerHTML = `
      <tr>
        <td colspan='3' class="alert alert-warning text-center" role="alert">
          The mailbox is empty.
        </td>
      </tr>`;
    }

    emails.forEach(email => {
      const tr = document.createElement('tr');
      tr.dataset.id = email.id;
      
      // Check if email read/unread
      if (!email.read) {
        tr.classList.remove('email-read')
        tr.classList.add('email-unread')
      }
      if (email.read) {
        tr.classList.remove('email-unread')
        tr.classList.add('email-read')
      }

      // List emails into a table
      for (const prop in email) {       
        if (prop === 'sender') {
          const td = document.createElement('td');
          if (!email.read && mailbox === 'inbox') {
            td.innerHTML = `<i class="far fa-envelope"></i> ${email[prop]}`;
            tr.append(td);
          }

          if (email.read && mailbox === 'inbox') {
            td.innerHTML = `<i class="far fa-envelope-open"></i> ${email[prop]}`;
            tr.append(td);
          }
          
          if (mailbox === 'archive') {
            td.innerHTML = `<i class="fas fa-archive"></i> ${email[prop]}`;
            tr.append(td);
          }
        }

        if (prop === 'recipients' && mailbox === 'sent') {
          const td = document.createElement('td');
          td.innerHTML = `<i class="fas fa-angle-double-right"></i> ${email[prop]}`;
          tr.append(td);
        }

        if (prop === 'subject') {
          const td = document.createElement('td');
          td.innerHTML = email[prop];
          tr.append(td);
        }

        if (prop === 'timestamp') {
          const td = document.createElement('td');
          td.innerHTML = email[prop];
          tr.append(td);
        }
      }

      tbody.append(tr);
    
    });   
  });

}


// View mail function
function viewMail() {
  document.querySelector('tbody').addEventListener('click', (e) => {
    const emailId = e.target.parentElement.dataset.id;
    const view = document.querySelector('#emails-view');
    const mailbox = view.firstChild.innerHTML.toLowerCase();

    fetch(`/emails/${emailId}`)
    .then(response => response.json())
    .then(email => {
        // Print email
        view.innerHTML = `<h3>View Mail</h3><hr>
        <div class='view-mail-container' data-id=${emailId}>
            <div class='view-mail-header'>
              <div class='view-mail-header-top'>
                <h5>Subject: ${email.subject}</h5>
                <div>
                ${ mailbox !== 'sent' ? 
                  `<button type="button" class="btn btn-warning archive-btn"><i class="fas fa-archive"></i>&nbsp; ${email.archived ? '<span class="archive">Unarchive</span>': '<span class="archive">Archive</span>' }</button>`
                : '' }
                <button type="button" class="btn btn-success reply"><i class="fas fa-reply"></i>&nbsp; Reply</button>
                </div>
              </div>
              <div class='view-mail-header-bottom'>
                <p>From: ${email.sender}
                <br>To: ${email.recipients}</p>
                <p>${email.timestamp}</p>
              </div>
            </div>
            <div class='view-mail-main'>
              <p>${email.body}</p>
            </div>
        </div>`;

        // Mark email as read
        if (mailbox === 'inbox'){
          emailRead(emailId);
        }
                
        // Mark email as archived
        if (mailbox === 'inbox' || mailbox === 'archive'){
          archive();
        }

        // Reply to an email
        reply(email.sender, email.subject, email.timestamp, email.body)

    });
  });

}


// Reply to an email function
function reply(recipient, subject, timestamp, body) {
  document.querySelector('.reply').addEventListener('click', () => {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Pre-fill values
    let subjectPreFill = '';
    if (subject.startsWith('Re: ')) {
      subjectPreFill = `${subject}`
    } else {
      subjectPreFill = `Re: ${subject}`
    }

    document.querySelector('#compose-recipients').value = recipient;
    document.querySelector('#compose-subject').value = subjectPreFill;
    document.querySelector('#compose-body').value = `\n\n\n----- On ${timestamp} ${recipient} wrote:\n${body}`;
  });
}


// Mark email as read function
function emailRead(emailId) {
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}


// Mark email as archived function
function archive() {
  const viewMail = document.querySelector('.view-mail-container');
  const archiveBtn = document.querySelector('.archive-btn');
  const archive = document.querySelector('.archive');
  const emailId = viewMail.dataset.id;

  archiveBtn.addEventListener('click', () => {
    let onOff = true;
    if (archive.textContent === 'Archive') {
      onOff = true;
    } else {
      onOff = false;
    }

    fetch(`/emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: onOff
      })
    }).then(() => {
      load_mailbox('inbox')
    })
  });
  
}