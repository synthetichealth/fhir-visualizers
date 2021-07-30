import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import moment from 'moment';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".health-record__header {\n  font-family: 'Open Sans', sans-serif;\n  display: -ms-flexbox;\n  display: flex;\n  color: #6b8eb6;\n  font-size: 1em;\n  font-weight: bold;\n  text-transform: uppercase;\n  margin: 40px 0;\n}\n​\n.health-record__header .header-divider {\n  width: 100%;\n  border-bottom: 1px solid #7e90a3;\n  margin-bottom: 10px;\n}\n​\n.report-line {\n  background: #EAEAEA;\n}\n\n.display-linebreak {\n  white-space: pre-line;\n}\n\ndl {\n  margin-top:0;\n  margin-bottom:20px\n}\n\ndd,dt {\n  line-height:1.42857\n}\n\ndt {\n  font-weight:700\n}\n\ndd {\n  margin-left:0\n}\n.dl-horizontal dd:after,.dl-horizontal dd:before {\n  content:\" \";\n  display:table\n}\n\n.dl-horizontal dd:after {\n  clear:both\n}\n\n@media (min-width:768px) {\n  .dl-horizontal dt {\n    float:left;\n    clear:left;\n    text-align:right;\n    overflow:hidden;\n    text-overflow:ellipsis;\n    white-space:nowrap\n  }\n  .dl-horizontal dd {\n    margin-left:180px\n  }\n}\n";
styleInject(css_248z);

const DSTU2 = '1.0.2';
const STU3 = '3.0.1';
const R4 = '4.0.0';

const round = function (num, digits) {
  return Number.parseFloat(num).toFixed(digits);
};

const FORMATTERS = {
  date: str => moment(str).format('YYYY-MM-DD'),
  time: str => moment(str).format('HH:mm:ss'),
  dateTime: str => moment(str).format('YYYY-MM-DD - h:mm:ss a'),
  numberWithCommas: str => str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
  code: code => `${code.code} ${code.display ? code.display : ''}`,
  period: period => `${moment(period.start).format('YYYY-MM-DD - h:mm:ss a')} -> ${moment(period.end).format('YYYY-MM-DD - h:mm:ss a')}`
};
const SPACER = {
  title: '',
  versions: '*',
  getter: () => ''
};

const obsValue = entry => {
  if (entry == null) {
    return '';
  } else if (entry.valueQuantity) {
    return round(entry.valueQuantity.value, 2) + ' ' + entry.valueQuantity.code;
  } else if (entry.valueCodeableConcept) {
    return entry.valueCodeableConcept.coding[0].display;
  } else if (entry.valueString) {
    return entry.valueString;
  }

  if (entry.code.coding[0].display === "Blood Pressure") {
    if (!entry.component[0].valueQuantity) {
      return ''; // WTF!!
    }

    const v1 = Number.parseFloat(entry.component[0].valueQuantity.value);
    const v2 = Number.parseFloat(entry.component[1].valueQuantity.value);
    const s1 = v1.toFixed(0);
    const s2 = v2.toFixed(0);

    if (v1 > v2) {
      return s1 + ' / ' + s2 + ' mmHg';
    } else {
      return s2 + ' / ' + s1 + ' mmHg';
    }
  }

  return '';
};

const attributeXTime = (entry, type) => {
  if (entry == null) {
    return '';
  } else if (entry[`${type}DateTime`]) {
    return FORMATTERS['dateTime'](entry[`${type}DateTime`]);
  } else if (entry[`${type}Period`]) {
    return FORMATTERS['period'](entry[`${type}Period`]);
  }

  return '';
};

class PatientVisualizer extends React.Component {
  render() {
    const patient = this.props.patient;
    patient.extension = patient.extension || [];
    const raceExt = patient.extension.find(e => {
      return e.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race';
    });
    let race;

    if (raceExt) {
      race = raceExt.extension[0].valueString || raceExt.extension[0].valueCoding.display;
    } else {
      race = null;
    }

    const ethExt = patient.extension.find(e => {
      return e.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity';
    });
    let ethnicity;

    if (ethExt) {
      ethnicity = ethExt.extension[0].valueString || ethExt.extension[0].valueCoding.display;
    } else {
      ethnicity = null;
    }

    let language = null;

    if (patient.communication && patient.communication[0] && patient.communication[0].language && patient.communication[0].language.coding && patient.communication[0].language.coding[0]) {
      language = patient.communication[0].language.coding[0].display;
    }

    const observations = this.props.observations || [];
    const searchableObs = observations.slice().reverse();
    const height_obs = searchableObs.find(o => o.code.coding[0].display === 'Body Height');
    const weight_obs = searchableObs.find(o => o.code.coding[0].display === 'Body Weight');
    const cause_of_death_obs = null;
    const hasAddress = patient.address && patient.address[0]; // let lat, lng;
    // if (hasAddress && patient.address[0].extension) {
    //   const geolocation = patient.address[0].extension.find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/geolocation');
    //   if (geolocation && geolocation.extension.length > 1) {
    //     lat = geolocation.extension.find(e => e.url === 'latitude').valueDecimal;
    //     lng = geolocation.extension.find(e => e.url === 'longitude').valueDecimal;
    //   }
    // }

    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "health-record__header"
    }, /*#__PURE__*/React.createElement("div", {
      className: "header-title"
    }, "Patient"), /*#__PURE__*/React.createElement("div", {
      className: "header-divider"
    })), /*#__PURE__*/React.createElement("div", {
      id: "p_brief",
      className: "row"
    }, /*#__PURE__*/React.createElement("div", {
      id: "p_brief_records",
      className: "col-6"
    }, /*#__PURE__*/React.createElement("div", {
      id: "p_brief_name_address",
      className: "p_block"
    }, /*#__PURE__*/React.createElement("dl", {
      className: "dl-horizontal p_brief_family"
    }, /*#__PURE__*/React.createElement("dt", null, "Name"), /*#__PURE__*/React.createElement("dd", null, patient.name[0].family, ", ", patient.name[0].given.join(' ')), /*#__PURE__*/React.createElement("dt", null, "Gender"), /*#__PURE__*/React.createElement("dd", null, patient.gender), /*#__PURE__*/React.createElement("dt", null, "Date of Birth"), /*#__PURE__*/React.createElement("dd", null, patient.birthDate), /*#__PURE__*/React.createElement("dt", null, "Address"), /*#__PURE__*/React.createElement("dd", null, hasAddress && patient.address[0].line.join(' ')), /*#__PURE__*/React.createElement("dt", null, "City, State"), /*#__PURE__*/React.createElement("dd", null, hasAddress && patient.address[0].city, ", ", hasAddress && patient.address[0].state), /*#__PURE__*/React.createElement("dt", null, "Postal Code"), /*#__PURE__*/React.createElement("dd", null, hasAddress && patient.address[0].postalCode), patient.deceasedDateTime && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Date of Death"), /*#__PURE__*/React.createElement("dd", null, patient.deceasedDateTime))))), /*#__PURE__*/React.createElement("div", {
      id: "p_brief_records",
      className: "col-6"
    }, /*#__PURE__*/React.createElement("div", {
      id: "p_brief_name_address",
      className: "p_block"
    }, /*#__PURE__*/React.createElement("dl", {
      className: "dl-horizontal p_brief_family"
    }, /*#__PURE__*/React.createElement("dt", null, "Height"), /*#__PURE__*/React.createElement("dd", null, obsValue(height_obs)), /*#__PURE__*/React.createElement("dt", null, "Weight"), /*#__PURE__*/React.createElement("dd", null, obsValue(weight_obs)), /*#__PURE__*/React.createElement("dt", null, "Race"), /*#__PURE__*/React.createElement("dd", null, race || 'unk.'), /*#__PURE__*/React.createElement("dt", null, "Ethnicity"), /*#__PURE__*/React.createElement("dd", null, ethnicity || 'unk.'), /*#__PURE__*/React.createElement("dt", null, "Language"), /*#__PURE__*/React.createElement("dd", null, language || 'unk.'), /*#__PURE__*/React.createElement("dt", null, "Blood Type"), /*#__PURE__*/React.createElement("dd", null, "unknown"), patient.deceasedDateTime && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Cause of Death"), /*#__PURE__*/React.createElement("dd", null, cause_of_death_obs)))))));
  }

}

class GenericVisualizer extends React.Component {
  /*
    columns: [
      { title: 'SNOMED', getter: (c) => c.code.coding[0].code, versions: ['1.0.2', '3.0.1', '4.0.0'] }
    ],
    rows: // fhir[]
    keyFn: (c) => c.id
  */
  onRowClick(line) {
    if (this.props.onRowClick) {
      this.props.onRowClick(line);
    }
  }

  rowClass(line) {
    if (this.props.dynamicRowClass) {
      return this.props.dynamicRowClass(line);
    } else if (this.props.rowClass) {
      return this.props.rowClass;
    }

    return '';
  }

  renderHeaderLine() {
    const columns = this.props.columns.filter(c => c.versions === '*' || c.versions.includes(this.props.version)).map(c => c.title);
    return columns.map(c => /*#__PURE__*/React.createElement("th", {
      scope: "col",
      key: c
    }, c));
  }

  renderBodyLine(line) {
    const columns = this.props.columns.filter(c => c.versions === '*' || c.versions.includes(this.props.version));
    const nestedRows = [];

    if (this.props.nestedRows) {
      for (const nestedRow of this.props.nestedRows) {
        let subRowLines;

        try {
          subRowLines = nestedRow.getter(line);
        } catch (e) {
          subRowLines = undefined;
        }

        if (!subRowLines) continue;
        const subColumns = nestedRow.columns.filter(c => c.versions === '*' || c.versions.includes(this.props.version));

        for (const subRowLine of subRowLines) {
          nestedRows.push( /*#__PURE__*/React.createElement("tr", {
            key: nestedRow.keyFn(subRowLine)
          }, subColumns.map((c, i) => {
            const formatter = FORMATTERS[c.format];
            let result;

            try {
              result = c.getter(subRowLine);
            } catch (e) {
              result = undefined;
            }

            if (result && formatter) {
              result = formatter(result);
            }

            if (!result && c.defaultValue) {
              result = c.defaultValue;
            }

            return /*#__PURE__*/React.createElement("td", {
              key: i
            }, /*#__PURE__*/React.createElement("div", {
              className: "display-linebreak"
            }, result));
          })));
        }
      }
    }

    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: this.props.keyFn(line)
    }, /*#__PURE__*/React.createElement("tr", {
      onClick: () => this.onRowClick(line),
      className: this.rowClass(line),
      key: this.props.keyFn(line)
    }, columns.map((c, i) => {
      const formatter = FORMATTERS[c.format];
      let result;

      try {
        result = c.getter(line);
      } catch (e) {
        result = undefined;
      }

      if (result && formatter) {
        result = formatter(result);
      }

      if (!result && c.defaultValue) {
        result = c.defaultValue;
      }

      return /*#__PURE__*/React.createElement("td", {
        key: i
      }, /*#__PURE__*/React.createElement("div", {
        className: "display-linebreak"
      }, result));
    })), nestedRows); // TODO: multi-liners
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      id: this.props.title
    }, /*#__PURE__*/React.createElement("div", {
      className: "health-record__header"
    }, /*#__PURE__*/React.createElement("div", {
      className: "header-title"
    }, /*#__PURE__*/React.createElement("a", {
      id: this.props.title
    }, this.props.title)), /*#__PURE__*/React.createElement("div", {
      className: "header-divider"
    })), /*#__PURE__*/React.createElement("table", {
      className: "table table-sm table-hover"
    }, /*#__PURE__*/React.createElement("thead", {
      id: `p_${this.props.title}_head`
    }, /*#__PURE__*/React.createElement("tr", null, this.renderHeaderLine())), /*#__PURE__*/React.createElement("tbody", {
      id: `p_${this.props.title}_list`
    }, this.props.rows && this.props.rows.slice().reverse().map(c => this.renderBodyLine(c)))));
  }

}

class ResourceVisualizer extends React.Component {
  render() {
    const resourceType = this.props.resourceType;
    if (resourceType === "Patient") return /*#__PURE__*/React.createElement(PatientVisualizer, {
      patient: this.props.patient
    });else if (resourceType === "Condition") return /*#__PURE__*/React.createElement(ConditionsVisualizer, {
      rows: this.props.rows
    });else if (resourceType === "Observation") return /*#__PURE__*/React.createElement(ObservationsVisualizer, {
      rows: this.props.rows
    });else if (resourceType === "DiagnosticReport") return /*#__PURE__*/React.createElement(ReportsVisualizer, {
      rows: this.props.rows
    });else if (resourceType === "MedicationRequest") return /*#__PURE__*/React.createElement(MedicationsVisualizer, {
      rows: this.props.rows
    });else if (resourceType === "AllergyIntolerance") return /*#__PURE__*/React.createElement(AllergiesVisualizer, {
      rows: this.props.rows
    });else if (resourceType === "CarePlan") return /*#__PURE__*/React.createElement(CarePlansVisualizer, {
      rows: this.props.rows
    });else if (resourceType === "Procedure") return /*#__PURE__*/React.createElement(ProceduresVisualizer, {
      rows: this.props.rows
    });else if (resourceType === "Encounter") return /*#__PURE__*/React.createElement(EncountersVisualizer, {
      rows: this.props.rows
    });else if (resourceType === "Immunization") return /*#__PURE__*/React.createElement(ImmunizationsVisualizer, {
      rows: this.props.rows
    });
  }

}

class ConditionsVisualizer extends GenericVisualizer {}

_defineProperty(ConditionsVisualizer, "defaultProps", {
  title: 'Conditions',
  columns: [{
    title: 'Condition',
    versions: '*',
    format: 'code',
    getter: c => c.code.coding[0]
  }, {
    title: 'Date of Onset',
    versions: '*',
    format: 'date',
    getter: c => c.onsetDateTime
  }, {
    title: 'Date Resolved',
    'versions': '*',
    format: 'date',
    getter: c => c.abatementDateTime,
    defaultValue: 'N/A'
  }, {
    title: 'Recorded Date',
    versions: '*',
    format: 'date',
    getter: c => c.recordedDate
  }, {
    title: 'Severity',
    versions: '*',
    format: 'code',
    getter: c => c.severity.coding[0]
  }, {
    title: 'Body Site',
    versions: '*',
    format: 'code',
    getter: c => c.bodySite[0].coding[0]
  }],
  keyFn: c => c.id
});

class ObservationsVisualizer extends GenericVisualizer {}

_defineProperty(ObservationsVisualizer, "defaultProps", {
  title: 'Observations',
  columns: [{
    title: 'Observation',
    versions: '*',
    format: 'code',
    getter: o => o.code.coding[0]
  }, {
    title: 'Value',
    versions: '*',
    getter: o => obsValue(o)
  }, {
    title: 'Effective',
    'versions': '*',
    getter: o => attributeXTime(o, 'effective')
  }, {
    title: 'Issued Date',
    'versions': '*',
    format: 'date',
    getter: o => o.issued
  }, {
    title: 'ID',
    versions: '*',
    getter: o => o.id
  }],
  keyFn: o => o.id
});

class ReportsVisualizer extends GenericVisualizer {}

_defineProperty(ReportsVisualizer, "defaultProps", {
  title: 'Reports',
  columns: [{
    title: 'Report/Observation',
    versions: '*',
    format: 'code',
    getter: r => r.code.coding[0]
  }, {
    title: 'Value',
    versions: '*',
    getter: () => ''
  }, {
    title: 'Effective',
    'versions': '*',
    getter: r => attributeXTime(r, 'effective'),
    defaultValue: 'N/A'
  }],
  rowClass: 'report-line',
  nestedRows: [{
    getter: rpt => rpt.observations,
    keyFn: o => o.id,
    columns: [{
      title: 'Report/Observation',
      versions: '*',
      format: 'code',
      getter: o => o.code.coding[0]
    }, {
      title: 'Value',
      versions: '*',
      getter: o => obsValue(o)
    }, SPACER]
  }, {
    getter: rpt => rpt.presentedForm,
    keyFn: p => Math.floor(Math.random() * 100),
    // TODO, pass in index
    columns: [SPACER, {
      title: 'Content',
      versions: '*',
      getter: p => atob(p.data)
    }, SPACER, SPACER]
  }],
  keyFn: r => r.id
});

class MedicationsVisualizer extends GenericVisualizer {}

_defineProperty(MedicationsVisualizer, "defaultProps", {
  title: 'Medications',
  columns: [{
    title: 'Medication',
    versions: '*',
    format: 'code',
    getter: c => c.medicationCodeableConcept.coding[0]
  }, {
    title: 'Date Prescribed',
    versions: '*',
    format: 'date',
    getter: c => c.authoredOn
  }, {
    title: 'Status',
    'versions': '*',
    getter: c => c.status
  }],
  keyFn: c => c.id
});

class AllergiesVisualizer extends GenericVisualizer {}

_defineProperty(AllergiesVisualizer, "defaultProps", {
  title: 'Allergies',
  columns: [{
    title: 'Allergy',
    versions: '*',
    format: 'code',
    getter: a => a.code.coding[0]
  }, {
    title: 'Date Recorded',
    versions: [R4],
    getter: a => a.recordedDate
  }, {
    title: 'Date Recorded',
    versions: [DSTU2, STU3],
    format: 'date',
    getter: a => a.assertedDate
  }, {
    title: 'Onset',
    versions: '*',
    format: 'date',
    getter: a => a.onsetDateTime
  }, {
    title: 'Resolution Age',
    versions: '*',
    format: 'date',
    getter: a => a.extension.resolutionAge
  }],
  keyFn: c => c.id
});

const goalDescriptionDSTU2 = goal => {
  if (goal.description) return goal.description;
  return '';
};

const goalDescriptionSTU3R4 = goal => {
  if (goal.description) return goal.description.text;
  return '';
};

class CarePlansVisualizer extends GenericVisualizer {}

_defineProperty(CarePlansVisualizer, "defaultProps", {
  title: 'CarePlans',
  columns: [{
    title: 'Care Plan',
    versions: '*',
    format: 'code',
    getter: c => c.category[0].coding[0]
  }, {
    title: 'Date',
    versions: '*',
    format: 'period',
    getter: c => c.period
  }],
  nestedRows: [{
    getter: cp => cp.goals,
    keyFn: g => g.id,
    columns: [SPACER, {
      title: 'Goal',
      versions: [DSTU2],
      getter: g => `Goal: ${goalDescriptionDSTU2(g)}`
    }, {
      title: 'Goal',
      versions: [STU3, R4],
      getter: g => `Goal: ${goalDescriptionSTU3R4(g)}`
    }, SPACER]
  }, {
    getter: cp => cp.activity,
    keyFn: a => Math.random(),
    columns: [SPACER, {
      title: 'Activity',
      versions: '*',
      format: 'code',
      getter: a => a.detail.code.coding[0]
    }, SPACER]
  }],
  keyFn: c => c.id
});

class ProceduresVisualizer extends GenericVisualizer {}

_defineProperty(ProceduresVisualizer, "defaultProps", {
  title: 'Procedures',
  columns: [{
    title: 'Procedure',
    versions: '*',
    format: 'code',
    getter: p => p.code.coding[0]
  }, {
    title: 'Performed',
    versions: '*',
    getter: p => attributeXTime(p, 'performed')
  }, {
    title: 'ID',
    versions: '*',
    getter: p => p.id
  }, {
    title: 'Recorded',
    versions: '*',
    format: 'dateTime',
    getter: p => p.extension.recorded
  }, {
    title: 'Reason',
    versions: '*',
    format: 'code',
    getter: p => p.reasonCode.coding[0]
  }, {
    title: 'Status',
    versions: '*',
    getter: p => p.status
  }, {
    title: 'Status Reason',
    versions: '*',
    format: 'code',
    getter: p => p.statusReason.coding[0]
  }],
  keyFn: c => c.id
});

class EncountersVisualizer extends GenericVisualizer {}

_defineProperty(EncountersVisualizer, "defaultProps", {
  title: 'Encounters',
  columns: [{
    title: 'Encounter',
    versions: '*',
    format: 'code',
    getter: e => e.type[0].coding[0]
  }, {
    title: 'Period',
    versions: '*',
    format: 'period',
    getter: e => e.period
  }, {
    title: 'Diagnosis',
    versions: '*',
    getter: e => e.diagnosis.map(d => d.condition.reference).join()
  }, {
    title: 'Discharge Disposition',
    versions: '*',
    format: 'code',
    getter: e => e.hospitalization.dischargeDisposition.coding[0]
  }],
  keyFn: c => c.id
});

class ImmunizationsVisualizer extends GenericVisualizer {}

_defineProperty(ImmunizationsVisualizer, "defaultProps", {
  title: 'Vaccinations',
  columns: [{
    title: 'Vaccine',
    versions: '*',
    format: 'code',
    getter: i => i.vaccineCode.coding[0]
  }, {
    title: 'Date Given',
    versions: '*',
    format: 'date',
    getter: i => i.occurrenceDateTime
  }, {
    title: 'Date Recorded',
    versions: '*',
    format: 'date',
    getter: i => i.recorded
  }],
  keyFn: c => c.id
});

class DocumentReferencesVisualizer extends GenericVisualizer {}

_defineProperty(DocumentReferencesVisualizer, "defaultProps", {
  title: 'Documents',
  columns: [{
    title: 'Date',
    versions: '*',
    format: 'date',
    getter: d => d.date
  }, {
    title: 'Content',
    versions: '*',
    getter: d => atob(d.content[0].attachment.data)
  }],
  keyFn: dr => dr.id
});

class ServiceRequestVisualizer extends GenericVisualizer {}

_defineProperty(ServiceRequestVisualizer, "defaultProps", {
  title: 'Service Requests',
  columns: [{
    title: 'Service',
    versions: '*',
    format: 'code',
    getter: s => s.code.coding[0]
  }, {
    title: 'Author Date',
    versions: '*',
    format: 'date',
    getter: s => s.authoredOn
  }, {
    title: 'Status',
    versions: '*',
    getter: s => s.status
  }, {
    title: 'Reason',
    versions: '*',
    format: 'code',
    getter: s => s.reasonCode[0].coding[0]
  }, {
    title: 'ID',
    versions: '*',
    getter: s => s.id
  }, {
    title: 'Do Not Perform',
    versions: '*',
    getter: s => s.doNotPerform
  }, {
    title: 'Reason Refused',
    versions: '*',
    format: 'code',
    getter: s => s.extension.reasonRefused.coding[0]
  }],
  keyFn: s => s.id
});

class DeviceRequestVisualizer extends GenericVisualizer {}

_defineProperty(DeviceRequestVisualizer, "defaultProps", {
  title: 'Device Requests',
  columns: [{
    title: 'Device',
    versions: '*',
    format: 'code',
    getter: d => d.codeCodeableConcept.coding[0]
  }, {
    title: 'Author Date',
    versions: '*',
    format: 'date',
    getter: d => d.authoredOn
  }, {
    title: 'Do Not Perform',
    versions: '*',
    getter: d => d.modifierExtension.doNotPerform
  }, {
    title: 'Do Not Perform Reason',
    versions: '*',
    format: 'code',
    getter: s => s.extension.doNotPerformReason.coding[0]
  }],
  keyFn: d => d.id
});

class CommunicationVisualizer extends GenericVisualizer {}

_defineProperty(CommunicationVisualizer, "defaultProps", {
  title: 'Communications',
  columns: [{
    title: 'Reason',
    versions: '*',
    format: 'code',
    getter: c => c.reasonCode[0].coding[0]
  }, {
    title: 'Sent',
    versions: '*',
    format: 'date',
    getter: c => c.sent
  }, {
    title: 'Received',
    versions: '*',
    format: 'date',
    getter: c => c.received
  }, {
    title: 'Status',
    versions: '*',
    getter: c => c.status
  }],
  keyFn: c => c.id
});

class CoverageVisualizer extends GenericVisualizer {}

_defineProperty(CoverageVisualizer, "defaultProps", {
  title: 'Coverage',
  columns: [{
    title: 'Type',
    versions: '*',
    format: 'code',
    getter: c => c.type.coding[0]
  }, {
    title: 'Period',
    versions: '*',
    format: 'period',
    getter: c => c.period
  }],
  keyFn: c => c.id
});

class AdverseEventVisualizer extends GenericVisualizer {}

_defineProperty(AdverseEventVisualizer, "defaultProps", {
  title: 'Adverse Events',
  columns: [{
    title: 'Event',
    versions: '*',
    format: 'code',
    getter: a => a.event.coding[0]
  }, {
    title: 'Date',
    versions: '*',
    format: 'date',
    getter: a => a.date
  }],
  keyFn: a => a.id
});

class NutritionOrderVisualizer extends GenericVisualizer {}

_defineProperty(NutritionOrderVisualizer, "defaultProps", {
  title: 'Nutrition Orders',
  columns: [{
    title: 'Preference',
    versions: '*',
    format: 'code',
    getter: n => n.foodPreferenceModifier[0].coding[0]
  }, {
    title: 'Exclusion',
    versions: '*',
    format: 'code',
    getter: n => n.excludeFoodModifier[0].coding[0]
  }, {
    title: 'Date',
    versions: '*',
    format: 'date',
    getter: n => n.dateTime
  }, {
    title: 'Status',
    versions: '*',
    getter: n => n.status
  }],
  keyFn: n => n.id
});

class MedicationRequestVisualizer extends GenericVisualizer {}

_defineProperty(MedicationRequestVisualizer, "defaultProps", {
  title: 'Medication Requests',
  columns: [{
    title: 'Medication',
    versions: '*',
    format: 'code',
    getter: m => m.medicationCodeableConcept.coding[0]
  }, {
    title: 'Dosage Timing',
    versions: '*',
    format: 'period',
    getter: m => m.dosageInstruction[0].timing.repeat.boundsPeriod
  }, {
    title: 'Dosage Date',
    versions: '*',
    format: 'date',
    getter: m => m.dosageInstruction[0].timing.event
  }, {
    title: 'Author Date',
    versions: '*',
    format: 'date',
    getter: m => m.authoredOn
  }, {
    title: 'Do Not Perform',
    versions: '*',
    getter: m => m.doNotPerform
  }, {
    title: 'Reason',
    versions: '*',
    format: 'code',
    getter: m => m.reasonCode[0].coding[0]
  }, {
    title: 'Route',
    versions: '*',
    format: 'code',
    getter: m => m.dosageInstruction[0].route.coding[0]
  }],
  keyFn: m => m.id
});

class MedicationAdministrationVisualizer extends GenericVisualizer {}

_defineProperty(MedicationAdministrationVisualizer, "defaultProps", {
  title: 'Medication Administration',
  columns: [{
    title: 'Medication',
    versions: '*',
    format: 'code',
    getter: m => m.medicationCodeableConcept.coding[0]
  }, {
    title: 'Route',
    versions: '*',
    format: 'code',
    getter: m => m.dosage.route.coding[0]
  }, {
    title: 'Effective',
    versions: '*',
    getter: m => attributeXTime(m, 'effective')
  }, {
    title: 'Status',
    versions: '*',
    getter: m => m.status
  }, {
    title: 'Status Reason',
    versions: '*',
    format: 'code',
    getter: m => m.statusReason[0].coding[0]
  }, {
    title: 'Recorded',
    versions: '*',
    format: 'date',
    getter: m => m.extension.recorded
  }],
  keyFn: m => m.id
});

class MedicationDispenseVisualizer extends GenericVisualizer {}

_defineProperty(MedicationDispenseVisualizer, "defaultProps", {
  title: 'Medication Dispenses',
  columns: [{
    title: 'Medication',
    versions: '*',
    format: 'code',
    getter: m => m.medicationCodeableConcept.coding[0]
  }, {
    title: 'Handed Over Date',
    versions: '*',
    format: 'date',
    getter: m => m.whenHandedOver
  }],
  keyFn: m => m.id
});

export { AdverseEventVisualizer, AllergiesVisualizer, CarePlansVisualizer, CommunicationVisualizer, ConditionsVisualizer, CoverageVisualizer, DeviceRequestVisualizer, DocumentReferencesVisualizer, EncountersVisualizer, ImmunizationsVisualizer, MedicationAdministrationVisualizer, MedicationDispenseVisualizer, MedicationRequestVisualizer, MedicationsVisualizer, NutritionOrderVisualizer, ObservationsVisualizer, PatientVisualizer, ProceduresVisualizer, ReportsVisualizer, ResourceVisualizer, ServiceRequestVisualizer };
