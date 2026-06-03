//import "../css/style.css"

const Web3 = require('web3');
const contract = require('@truffle/contract');

const votingArtifacts = require('../../build/contracts/Voting.json');
var VotingContract = contract(votingArtifacts)



window.App = {
  eventStart: function() {
    // Check for MetaMask
    if (typeof window.ethereum === 'undefined') {
      $("#msg").html("<p style='color:red;'>MetaMask is not installed. Please install MetaMask and refresh the page.</p>");
      $("#addCandidate, #addDate, #voteButton").attr("disabled", true);
      return;
    }
    VotingContract.setProvider(window.ethereum);
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(function(accounts) {
        if (!accounts || accounts.length === 0) {
          $("#msg").html("<p style='color:red;'>Please connect MetaMask and refresh the page.</p>");
          $("#addCandidate, #addDate, #voteButton").attr("disabled", true);
          return;
        }
        const account = accounts[0];
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
        $("#addCandidate, #addDate, #voteButton").attr("disabled", false);
        VotingContract.deployed().then(function(instance){
          instance.getCountCandidates().then(function(countCandidates){
            $(document).ready(function(){
              $('#addCandidate').off('click').on('click', function() {
                const nameCandidate = $('#name').val();
                const partyCandidate = $('#party').val();
                if (!nameCandidate || !partyCandidate) {
                  $("#msg").html("<p style='color:red;'>Please enter both candidate name and party.</p>");
                  return;
                }
                $('#addCandidate').attr('disabled', true);
                instance.addCandidate(nameCandidate, partyCandidate, {from: account})
                  .then(function(result){
                    $("#msg").html("<p>Candidate added successfully.</p>");
                    $('#addCandidate').attr('disabled', false);
                  })
                  .catch(function(err){
                    console.error("ERROR! " + err.message);
                    $("#msg").html("<p style='color:red;'>" + err.message + "</p>");
                    $('#addCandidate').attr('disabled', false);
                  });
              });

              $('#addDate').off('click').on('click', function(){
                const startDate = Date.parse(document.getElementById("startDate").value)/1000;
                const endDate = Date.parse(document.getElementById("endDate").value)/1000;
                if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
                  $("#msg").html("<p style='color:red;'>Please enter valid start and end dates.</p>");
                  return;
                }
                $('#addDate').attr('disabled', true);
                instance.setDates(startDate, endDate, {from: account})
                  .then(function(rslt){
                    $("#msg").html("<p>Dates set successfully.</p>");
                    $('#addDate').attr('disabled', false);
                  })
                  .catch(function(err){
                    console.error("ERROR! " + err.message);
                    $("#msg").html("<p style='color:red;'>" + err.message + "</p>");
                    $('#addDate').attr('disabled', false);
                  });
              });

              instance.getDates().then(function(result){
                const startDate = new Date(result[0]*1000);
                const endDate = new Date(result[1]*1000);
                $("#dates").text(startDate.toDateString(("#DD#/#MM#/#YYYY#")) + " - " + endDate.toDateString("#DD#/#MM#/#YYYY#"));
              }).catch(function(err){
                console.error("ERROR! " + err.message);
              });
            });

            for (let i = 0; i < countCandidates; i++){
              instance.getCandidate(i+1).then(function(data){
                const id = data[0];
                const name = data[1];
                const party = data[2];
                const voteCount = data[3];
                const viewCandidates = `<tr><td> <input class="form-check-input" type="radio" name="candidate" value="${id}" id=${id}>` + name + "</td><td>" + party + "</td><td>" + voteCount + "</td></tr>"
                $("#boxCandidate").append(viewCandidates)
              });
            }
            window.countCandidates = countCandidates;
          });

          instance.checkVote().then(function (voted) {
            if(!voted)  {
              $("#voteButton").attr("disabled", false);
            } else {
              $("#voteButton").attr("disabled", true);
            }
          });

        }).catch(function(err){
          console.error("ERROR! " + err.message);
          $("#msg").html("<p style='color:red;'>" + err.message + "</p>");
        });
      }).catch(function(err){
        console.error("ERROR! " + err.message);
        $("#msg").html("<p style='color:red;'>" + err.message + "</p>");
      });
  },

  vote: function() {
    if (typeof window.ethereum === 'undefined') {
      $("#msg").html("<p style='color:red;'>MetaMask is not installed. Please install MetaMask and refresh the page.</p>");
      return;
    }
    const candidateID = $("input[name='candidate']:checked").val();
    if (!candidateID) {
      $("#msg").html("<p>Please vote for a candidate.</p>");
      return;
    }
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(function(accounts) {
        if (!accounts || accounts.length === 0) {
          $("#msg").html("<p style='color:red;'>Please connect MetaMask and refresh the page.</p>");
          return;
        }
        const account = accounts[0];
        VotingContract.deployed().then(function(instance){
          $("#voteButton").attr("disabled", true);
          instance.vote(parseInt(candidateID), {from: account})
            .then(function(result){
              $("#msg").html("<p>Voted</p>");
              window.location.reload(1);
            })
            .catch(function(err){
              console.error("ERROR! " + err.message);
              $("#msg").html("<p style='color:red;'>" + err.message + "</p>");
              $("#voteButton").attr("disabled", false);
            });
        }).catch(function(err){
          console.error("ERROR! " + err.message);
          $("#msg").html("<p style='color:red;'>" + err.message + "</p>");
          $("#voteButton").attr("disabled", false);
        });
      }).catch(function(err){
        console.error("ERROR! " + err.message);
        $("#msg").html("<p style='color:red;'>" + err.message + "</p>");
      });
  }
}

window.addEventListener("load", function() {
  if (typeof web3 !== "undefined") {
    console.warn("Using web3 detected from external source like Metamask")
    window.eth = new Web3(window.ethereum)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for deployment. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
    window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"))
  }
  window.App.eventStart()
})
