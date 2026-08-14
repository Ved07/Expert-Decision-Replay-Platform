function DecisionTabs({ activeTab, setActiveTab }) {
  const tabs = [
    "Overview",
    "Alternatives",
    "Knowledge",
    "Attachments",
    "Versions",
    "Discussion",
  ];

  return (
    <div className="decision-tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? "tab active-tab" : "tab"}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default DecisionTabs;