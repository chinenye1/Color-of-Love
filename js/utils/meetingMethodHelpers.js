function checkEducationMethod(d) {
  return d.hcm2017q24_school === "yes" || d.hcm2017q24_college === "yes";
}

function checkProfessionalSettingMethod(d) {
  return (
    d.hcm2017q24_mil === "yes" ||
    d.hcm2017q24_customer === "yes" ||
    d.hcm2017q24_vol_org === "yes" ||
    d.hcm2017q24_work_neighbors === "yes"
  );
}

function checkSocialSettingMethod(d) {
  return (
    d.hcm2017q24_bar_restaurant === "yes" ||
    d.hcm2017q24_party === "yes" ||
    d.hcm2017q24_public === "yes" ||
    d.hcm2017q24_church === "yes" ||
    d.hcm2017q24_single_serve_nonint === "yes" // like "singles night at the cafe"
  );
}

function checkInternetSiteMethod(d) {
  return (
    d.hcm2017q24_internet_other === "yes" ||
    d.hcm2017q24_internet_dating === "yes" || // dating app
    d.hcm2017q24_internet_org === "yes" // internet site not dedicated to dating
  );
}

function checkOnlineSocialNetworkingMethod(d) {
  return (
    d.hcm2017q24_internet_soc_network === "yes" || // instagram or smth
    d.hcm2017q24_internet_game === "yes" ||
    d.hcm2017q24_internet_chat === "yes"
  );
}

function checkAbroadMethod(d) {
  return (
    d.hcm2017q24_vacation === "yes" || d.hcm2017q24_business_trip === "yes"
  );
}

function checkMutualConnectionMethod(d) {
  return (
    d.hcm2017q24_blind_date === "yes" || // usually blind dates get set up by someone you know
    d.hcm2017q24_met_through_family === "yes" ||
    d.hcm2017q24_met_through_friend === "yes" ||
    d.hcm2017q24_met_through_as_nghbrs === "yes" ||
    d.hcm2017q24_met_as_through_cowork === "yes"
  );
}

function getMeetingMethod(d) {
  let meetingMethod = "";
  for (let i = 0; i < 7; i++) {
    if (MEETING_METHODS_CHECKS_MAPPING[MEETING_METHODS[i]](d)) {
      meetingMethod = MEETING_METHODS[i];
    }
  }
  return meetingMethod;
}
