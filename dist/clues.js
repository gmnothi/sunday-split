(() => {
  function player(round,playerId) {
    const data=window.LINEUP_CLUES?.[round.season];
    if(!data || data.version!==1 || data.season!==round.season)return null;
    const format=data.formats[round.leagueId];
    const form=data.form[`${format}:${round.week}:${playerId}`];
    if(!form || !Array.isArray(form.games) || form.games.length>3 || (form.games.length && !Number.isFinite(form.average)) || form.games.some(g=>!Number.isFinite(g.points) || !(g.season<round.season || g.season===round.season && g.week<round.week)))return null;
    const opponent=data.opponents[`${round.week}:${playerId}`];
    return {opponent,average:form.average,games:form.games};
  }
  window.PlayerClues={player};
})();
