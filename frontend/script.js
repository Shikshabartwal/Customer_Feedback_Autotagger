const feedbackHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyze-btn');
  
  analyzeBtn.addEventListener('click', async () => {
    const feedback = document.getElementById('feedback').value.trim();
    if (!feedback) {
      alert('Please enter some feedback!');
      return;
    }

    analyzeBtn.disabled = true;

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: feedback })
      });

      if (!response.ok) throw new Error('Network response was not OK');

      const data = await response.json();

      feedbackHistory.push({ tags: data.tags, sentiment: data.sentiment });

      document.getElementById('results').classList.remove('hidden');
      document.getElementById('tags').textContent = data.tags.join(', ') || 'None';
      document.getElementById('sentiment').textContent = data.sentiment || 'N/A';
      document.getElementById('score').textContent = data.score?.toFixed(3) || 'N/A';

      const emojiMap = { positive: "🙂", neutral: "😐", negative: "🙁" };
      document.getElementById('sentiment-icon').textContent = emojiMap[data.sentiment] || "";

      const scorePercent = Math.round(data.score * 100);
      const bar = document.getElementById('confidence-bar');
      bar.style.width = scorePercent + '%';
      bar.style.backgroundColor = scorePercent > 70 ? '#4caf50' : scorePercent > 40 ? '#ffc107' : '#f44336';

      drawCumulativeCharts();

    } catch (error) {
      console.error('Error analyzing feedback:', error);
      alert('Error analyzing feedback: ' + error.message);
    } finally {
      analyzeBtn.disabled = false;
    }
  });
});

function getCumulativeTagCounts() {
  const allTags = {};
  feedbackHistory.forEach(entry => {
    entry.tags.forEach(tag => {
      allTags[tag] = (allTags[tag] || 0) + 1;
    });
  });
  return allTags;
}

function getCumulativeSentimentCounts() {
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  feedbackHistory.forEach(entry => {
    if (entry.sentiment in sentimentCounts) sentimentCounts[entry.sentiment]++;
  });
  return sentimentCounts;
}

function drawCumulativeCharts() {
  const tagData = getCumulativeTagCounts();
  const sentimentData = getCumulativeSentimentCounts();

  console.log("Drawing tag chart with:", tagData);
  console.log("Drawing sentiment chart with:", sentimentData);

  const tagCanvas = document.getElementById('tagChart');
  const sentimentCanvas = document.getElementById('sentimentChart');

  if (!tagCanvas || !sentimentCanvas) {
    console.error("Canvas elements not found!");
    return;
  }

  const tagCtx = tagCanvas.getContext('2d');
  if (window.tagChart) window.tagChart.destroy();
  window.tagChart = new Chart(tagCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(tagData),
      datasets: [{
        label: 'Tag Frequency',
        data: Object.values(tagData),
        backgroundColor: '#42a5f5'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const sentimentCtx = sentimentCanvas.getContext('2d');
  if (window.sentimentChart) window.sentimentChart.destroy();
  window.sentimentChart = new Chart(sentimentCtx, {
    type: 'pie',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [
          sentimentData.positive,
          sentimentData.neutral,
          sentimentData.negative
        ],
        backgroundColor: ['#4caf50', '#ffc107', '#f44336']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}
