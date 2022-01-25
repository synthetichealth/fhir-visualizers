import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './Visualizers.css';
import moment from 'moment';

const DSTU2 = '1.0.2';
const STU3 = '3.0.1';
const R4 = '4.0.0';

const round = function (num, digits) {
  return Number.parseFloat(num).toFixed(digits);
}

const FORMATTERS = {
  date: (str) => moment(str).format('YYYY-MM-DD'),
  time: (str) => moment(str).format('HH:mm:ss'),
  dateTime: (str) => moment(str).format('YYYY-MM-DD - h:mm:ss a'),
  numberWithCommas: (str) => str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
  code: (code) => `${code.code}: ${code.display ? code.display : ''}`,
  period: (period) => `${moment(period.start).format('YYYY-MM-DD - h:mm:ss a')} -> ${moment(period.end).format('YYYY-MM-DD - h:mm:ss a')}`
};

const SPACER = { title: '', versions: '*', getter: () => '' };

const obsValue = (entry) => {
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
}

const attributeXTime = (entry, type) => {
  if (entry == null) {
    return '';
  } else if (entry[`${type}DateTime`]) {
    return FORMATTERS['dateTime'](entry[`${type}DateTime`])
  } else if (entry[`${type}Period`]) {
    return FORMATTERS['period'](entry[`${type}Period`])
  }
  return '';
}

const duration = (period) => {
  if (!period.end) {
    return '';
  }
  let start = moment(period.start);
  let end = moment(period.end);
  return moment.duration( start.diff(end) ).humanize();
};

class PatientVisualizer extends React.Component {
  render() {
    const patient = this.props.patient;
    patient.extension = patient.extension || [];
    const raceExt = patient.extension.find((e) => { return e.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race'});
    let race;
    if (raceExt) {
      race = raceExt.extension[0].valueString || raceExt.extension[0].valueCoding.display;
    } else {
      race = null;
    }

    const ethExt = patient.extension.find((e) => { return e.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity'});
    let ethnicity;
    if (ethExt) {
      ethnicity = ethExt.extension[0].valueString || ethExt.extension[0].valueCoding.display;
    } else {
      ethnicity = null;
    }

    let language = null;
    if (patient.communication
      && patient.communication[0]
      && patient.communication[0].language
      && patient.communication[0].language.coding
      && patient.communication[0].language.coding[0]) {
      language = patient.communication[0].language.coding[0].display;
    }

    const observations = this.props.observations || [];

    const searchableObs = observations.slice().reverse();
    const height_obs = searchableObs.find(o => o.code.coding[0].display === 'Body Height');
    const weight_obs = searchableObs.find(o => o.code.coding[0].display === 'Body Weight');

    const cause_of_death_obs = null;

    const patientAddress = patient.address && patient.address[0];
    const patientName = patient.name && patient.name[0];

    // let lat, lng;
    // if (hasAddress && patient.address[0].extension) {
    //   const geolocation = patient.address[0].extension.find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/geolocation');

    //   if (geolocation && geolocation.extension.length > 1) {
    //     lat = geolocation.extension.find(e => e.url === 'latitude').valueDecimal;
    //     lng = geolocation.extension.find(e => e.url === 'longitude').valueDecimal;
    //   }
    // }

    return (
      <div>
      <div className="health-record__header"><div className="header-title">Patient</div><div className="header-divider"></div></div>
      <div id="p_brief" className="row">
        <div id="p_brief_records" className="col-6">
          <div id="p_brief_name_address" className="p_block">
            <dl className="dl-horizontal p_brief_family">
              <dt>Name</dt>
                <dd>{ patientName && patientName.family }, { patientName && patientName.given && patientName.given.join(' ') }</dd>
              <dt>Gender</dt>
                <dd>{ patient.gender }</dd>
              <dt>Date of Birth</dt>
                <dd>{ patient.birthDate }</dd>
              <dt>Address</dt>
                <dd>{ patientAddress && patientAddress.line && patientAddress.line.join(' ') }</dd>
              <dt>City, State</dt>
                <dd>{ patientAddress && patientAddress.city }, { patientAddress && patientAddress.state }</dd>
              <dt>Postal Code</dt>
                <dd>{ patientAddress && patientAddress.postalCode }</dd>
              {patient.deceasedDateTime && <React.Fragment><dt>Date of Death</dt>
                <dd>{ patient.deceasedDateTime }</dd></React.Fragment> }
            </dl>
          </div>
        </div>
        <div id="p_brief_records" className="col-6">
          <div id="p_brief_name_address" className="p_block">
            <dl className="dl-horizontal p_brief_family">
              <dt>Height</dt>
                <dd>{ obsValue(height_obs) }</dd>
              <dt>Weight</dt>
                <dd>{ obsValue(weight_obs) }</dd>
              <dt>Race</dt>
                <dd>{ race || 'unk.' }</dd>
              <dt>Ethnicity</dt>
                <dd>{ ethnicity || 'unk.' }</dd>
              <dt>Language</dt>
                <dd>{ language || 'unk.' }</dd>
              <dt>Blood Type</dt>
                <dd>unknown</dd>
              {patient.deceasedDateTime && <React.Fragment><dt>Cause of Death</dt>
                <dd>{ cause_of_death_obs }</dd></React.Fragment> }
            </dl>
          </div>
        </div>
      </div>
      </div>
    );
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
    if(this.props.onRowClick){
      this.props.onRowClick(line);
    }
  }

  rowClass(line) {
    if(this.props.dynamicRowClass){
      return this.props.dynamicRowClass(line);
    }else if(this.props.rowClass){
      return this.props.rowClass;
    }
    return '';
  }

  renderHeaderLine() {
    const columns =
      this.props.columns
        .filter(c => c.versions === '*' || c.versions.includes(this.props.version))
        .map(c => c.title);

    return columns.map(c => <th scope="col" key={c}>{c}</th>);
  }

  renderBodyLine(line) {
    const columns =
      this.props.columns
      .filter(c => c.versions === '*' || c.versions.includes(this.props.version));


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
       const subColumns =
         nestedRow.columns
         .filter(c => c.versions === '*' || c.versions.includes(this.props.version));

       for (const subRowLine of subRowLines) {
          nestedRows.push(<tr key={nestedRow.keyFn(subRowLine)}>
            { subColumns.map((c,i) => {
                const formatter = FORMATTERS[c.format];
                let result;
                try {
                  result = c.getter(subRowLine);
                } catch (e) {
                  result = undefined;
                }
                if (result && formatter){
                  result = formatter(result);
                }
                if (!result && c.defaultValue) {
                  result = c.defaultValue;
                }
                return (<td key={i}><div className="display-linebreak">{ result }</div></td>);
              }) }
          </tr>);
       }
     }
   }

    return (
        <React.Fragment key={this.props.keyFn(line)}>
          <tr onClick={() => this.onRowClick(line)} className={this.rowClass(line)} key={this.props.keyFn(line)}>
            { columns.map((c,i) => {
                const formatter = FORMATTERS[c.format];
                let result;
                try {
                  result = c.getter(line);
                } catch (e) {
                  result = undefined;
                }

                if (result && formatter){
                  result = formatter(result);
                }
                if (!result && c.defaultValue) {
                  result = c.defaultValue;
                }
                return (<td key={i}><div className="display-linebreak">{ result }</div></td>);
              }) }
          </tr>
          { nestedRows }
        </React.Fragment>
      );
    // TODO: multi-liners
  }

  render() {
    return (
      <div id={this.props.title}>
        <div className="health-record__header">
          <div className="header-title">
            <a id={this.props.title}>{ this.props.title }</a>
          </div>
          <div className="header-divider"></div>
        </div>
        <table className="table table-sm table-hover">
        <thead id={ `p_${this.props.title}_head` }>
          <tr>
            { this.renderHeaderLine() }
          </tr>
        </thead>
        <tbody id={ `p_${this.props.title}_list` }>
          { this.props.rows && this.props.rows.slice().reverse().map(c => this.renderBodyLine(c)) }
        </tbody>
        </table>
      </div>
    );
  }
}


class ResourceVisualizer extends React.Component {
  render() {
    const resourceType = this.props.resourceType;
    if (resourceType === "Patient")
      return <PatientVisualizer patient={this.props.patient} />;
    else if (resourceType === "Condition")
      return <ConditionsVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "Observation")
      return <ObservationsVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass} />;
    else if (resourceType === "DiagnosticReport")
      return <ReportsVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "Medication")
      return <MedicationsVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "AllergyIntolerance")
      return <AllergiesVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "CarePlan")
      return <CarePlansVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "Procedure")
      return <ProceduresVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "Encounter")
      return <EncountersVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "Immunization")
      return <ImmunizationsVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "ServiceRequest")
      return <ServiceRequestVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "DeviceRequest")
      return <DeviceRequestVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "Communication")
      return <CommunicationVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "Coverage")
      return <CoverageVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "AdverseEvent")
      return <AdverseEventVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "NutritionOrder")
      return <NutritionOrderVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "MedicationRequest")
      return <MedicationRequestVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "MedicationAdministration")
      return <MedicationAdministrationVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
    else if (resourceType === "MedicationDispense")
      return <MedicationDispenseVisualizer rows={this.props.rows} onRowClick={this.props.onRowClick} dynamicRowClass={this.props.dynamicRowClass}/>;
  }
}


class ConditionsVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Conditions',
    columns: [
        { title: 'Condition', versions: '*', format: 'code', getter: c => c.code.coding[0] },
        { title: 'Date of Onset', versions: '*', format: 'date', getter: c => c.onsetDateTime },
        { title: 'Date Resolved', 'versions': '*', format: 'date', getter: c => c.abatementDateTime, defaultValue: 'N/A' },
        { title: 'Recorded Date', versions: '*', format: 'date', getter: c => c.recordedDate },
        { title: 'Severity', versions: '*', format: 'code', getter: c => c.severity.coding[0] },
        { title: 'Body Site', versions: '*', format: 'code', getter: c => c.bodySite[0].coding[0] }
      ],
      keyFn: c => c.id
  };
}


class ObservationsVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Observations',
    columns: [
        { title: 'Observation', versions: '*', format: 'code', getter: o => o.code.coding[0] },
        { title: 'Value', versions: '*', getter: o => obsValue(o) },
        { title: 'Effective', 'versions': '*', getter: o => attributeXTime(o,'effective') },
        { title: 'Issued Date', 'versions': '*', format: 'date', getter: o => o.issued },
        { title: 'ID', versions: '*', getter: o => o.id }
      ],
      keyFn: o => o.id
  };
}


class ReportsVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Reports',
    columns: [
        { title: 'Report/Observation', versions: '*', format: 'code', getter: r => r.code.coding[0] },
        { title: 'Value', versions: '*', getter: () => '' },
        { title: 'Effective', 'versions': '*', getter: r => attributeXTime(r,'effective'), defaultValue: 'N/A' }
      ],
    rowClass: 'report-line',
    nestedRows: [
      {
        getter: rpt => rpt.observations,
        keyFn: o => o.id,
        columns: [
          { title: 'Report/Observation', versions: '*', format: 'code', getter: o => o.code.coding[0] },
          { title: 'Value', versions: '*', getter: o => obsValue(o) },
          SPACER
        ]
      },
      {
        getter: rpt => rpt.presentedForm,
        keyFn: p => Math.floor(Math.random() * 100), // TODO, pass in index
        columns: [
          { title: 'Content', versions: '*', getter: p => atob(p.data) },
          SPACER,
          SPACER
        ]
      }
    ],
    keyFn: r => r.id
  };
}

class MedicationsVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Medications',
    columns: [
        { title: 'Medication', versions: '*', format: 'code', getter: c => c.medicationCodeableConcept.coding[0] },
        { title: 'Date Prescribed', versions: '*', format: 'date', getter: c => c.authoredOn },
        { title: 'Status', 'versions': '*', getter: c => c.status }
      ],
      keyFn: c => c.id
  };
}

class AllergiesVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Allergies',
    columns: [
        { title: 'Allergy', versions: '*', format: 'code', getter: a => a.code.coding[0] },
        { title: 'Date Recorded', versions: [R4], getter: a => a.recordedDate },
        { title: 'Date Recorded', versions: [DSTU2, STU3], format: 'date', getter: a => a.assertedDate },
        { title: 'Onset', versions: '*', format: 'date', getter: a => a.onsetDateTime },
        { title: 'Resolution Age', versions: '*', format: 'date', getter: a => a.extension.resolutionAge }
      ],
      keyFn: c => c.id
  };
}

const goalDescriptionDSTU2 = (goal) => {
  if (goal.description) return goal.description;
  return '';
};

const goalDescriptionSTU3R4 = (goal) => {
  if (goal.description) return goal.description.text;
  return '';
};


class CarePlansVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'CarePlans',
    columns: [
        { title: 'Care Plan', versions: '*', format: 'code', getter: c => c.category[0].coding[0] },
        { title: 'Date', versions: '*', format: 'period', getter: c => c.period }
    ],
    nestedRows: [
      {
        getter: cp => cp.goals,
        keyFn: g => g.id,
        columns: [
          { title: 'Goal', versions: [DSTU2], getter: g => `Goal: ${goalDescriptionDSTU2(g)}` },
          { title: 'Goal', versions: [STU3, R4], getter: g => `Goal: ${goalDescriptionSTU3R4(g)}` },
          SPACER
        ]
      },
      {
        getter: cp => cp.activity,
        keyFn: a => Math.random(),
        columns: [
          { title: 'Activity', versions: '*', format: 'code', getter: a => a.detail.code.coding[0] },
          SPACER
        ]
      }
    ],
    keyFn: c => c.id
  };
}

class ProceduresVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Procedures',
    columns: [
      { title: 'Procedure', versions: '*', format: 'code', getter: p => p.code.coding[0] },
      { title: 'Performed', versions: '*', getter: p => attributeXTime(p,'performed') },
      { title: 'ID', versions: '*', getter: p => p.id },
      { title: 'Recorded', versions: '*', format: 'dateTime', getter: p => p.extension.recorded },
      { title: 'Reason', versions: '*', format: 'code', getter: p => p.reasonCode.coding[0] },
      { title: 'Status', versions: '*', getter: p => p.status },
      { title: 'Status Reason', versions: '*', format: 'code', getter: p => p.statusReason.coding[0] }
      ],
      keyFn: c => c.id
  };
}

class EncountersVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Encounters',
    columns: [
        { title: 'Encounter', versions: '*', format: 'code', getter: e => e.type[0].coding[0] },
        { title: 'Period', versions: '*', format: 'period', getter: e => e.period },
        { title: 'Diagnosis', versions: '*', getter: e => e.diagnosis.map(d => d.condition.reference).join()},
        { title: 'Discharge Disposition', versions: '*', format: 'code', getter: e => e.hospitalization.dischargeDisposition.coding[0] }
      ],
      keyFn: c => c.id
  };
}

class ImmunizationsVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Vaccinations',
    columns: [
        { title: 'Vaccine', versions: '*', format: 'code', getter: i => i.vaccineCode.coding[0] },
        { title: 'Date Given', versions: '*', format: 'date', getter: i => i.occurrenceDateTime },
        { title: 'Date Recorded', versions: '*', format: 'date', getter: i => i.recorded }
      ],
      keyFn: c => c.id
  };
}

class DocumentReferencesVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Documents',
    columns: [
        { title: 'Date', versions: '*', format: 'date', getter: d => d.date },
        { title: 'Content', versions: '*', getter: d => atob(d.content[0].attachment.data) }
      ],
      keyFn: dr => dr.id
  };
}

class ServiceRequestVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Service Requests',
    columns: [
        { title: 'Service', versions: '*', format: 'code', getter: s => s.code.coding[0] },
        { title: 'Author Date', versions: '*', format: 'date', getter: s => s.authoredOn },
        { title: 'Status', versions: '*', getter: s => s.status },
        { title: 'Reason', versions: '*', format: 'code', getter: s => s.reasonCode[0].coding[0] },
        { title: 'ID', versions: '*', getter: s => s.id },
        { title: 'Do Not Perform', versions: '*', getter: s => s.doNotPerform },
        { title: 'Reason Refused', versions: '*', format: 'code', getter: s => s.extension.reasonRefused.coding[0] }
      ],
      keyFn: s => s.id
  };
}

class DeviceRequestVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Device Requests',
    columns: [
        { title: 'Device', versions: '*', format: 'code', getter: d => d.codeCodeableConcept.coding[0] },
        { title: 'Author Date', versions: '*', format: 'date', getter: d => d.authoredOn },
        { title: 'Do Not Perform', versions: '*', getter: d => d.modifierExtension.doNotPerform },
        { title: 'Do Not Perform Reason', versions: '*', format: 'code', getter: s => s.extension.doNotPerformReason.coding[0] }
      ],
      keyFn: d => d.id
  };
}

class CommunicationVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Communications',
    columns: [
        { title: 'Reason', versions: '*', format: 'code', getter: c => c.reasonCode[0].coding[0] },
        { title: 'Sent', versions: '*', format: 'date', getter: c => c.sent },
        { title: 'Received', versions: '*', format: 'date', getter: c => c.received },
        { title: 'Status', versions: '*', getter: c => c.status }
      ],
      keyFn: c => c.id
  };
}

class CoverageVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Coverage',
    columns: [
        { title: 'Type', versions: '*', format: 'code', getter: c => c.type.coding[0] },
        { title: 'Period', versions: '*', format: 'period', getter: c => c.period }
      ],
      keyFn: c => c.id
  };
}

class AdverseEventVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Adverse Events',
    columns: [
        { title: 'Event', versions: '*', format: 'code', getter: a => a.event.coding[0] },
        { title: 'Date', versions: '*', format: 'date', getter: a => a.date }
      ],
      keyFn: a => a.id
  };
}

class NutritionOrderVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Nutrition Orders',
    columns: [
        { title: 'Preference', versions: '*', format: 'code', getter: n => n.foodPreferenceModifier[0].coding[0] },
        { title: 'Exclusion', versions: '*', format: 'code', getter: n => n.excludeFoodModifier[0].coding[0] },
        { title: 'Date', versions: '*', format: 'date', getter: n => n.dateTime },
        { title: 'Status', versions: '*', getter: n => n.status }
      ],
      keyFn: n => n.id
  };
}

class MedicationRequestVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Medication Requests',
    columns: [
        { title: 'Medication', versions: '*', format: 'code', getter: m => m.medicationCodeableConcept.coding[0] },
        { title: 'Dosage Timing', versions: '*', format: 'period', getter: m => m.dosageInstruction[0].timing.repeat.boundsPeriod},
        { title: 'Dosage Date', versions: '*', format: 'date', getter: m => m.dosageInstruction[0].timing.event},
        { title: 'Author Date', versions: '*', format: 'date', getter: m => m.authoredOn },
        { title: 'Do Not Perform', versions: '*', getter: m => m.doNotPerform},
        { title: 'Reason', versions: '*', format: 'code', getter: m => m.reasonCode[0].coding[0] },
        { title: 'Route', versions: '*', format: 'code', getter: m => m.dosageInstruction[0].route.coding[0] }
      ],
      keyFn: m => m.id
  };
}

class MedicationAdministrationVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Medication Administration',
    columns: [
        { title: 'Medication', versions: '*', format: 'code', getter: m => m.medicationCodeableConcept.coding[0] },
        { title: 'Route', versions: '*', format: 'code', getter: m => m.dosage.route.coding[0] },
        { title: 'Effective', versions: '*', getter: m => attributeXTime(m,'effective')},
        { title: 'Status', versions: '*', getter: m => m.status},
        { title: 'Status Reason', versions: '*', format: 'code', getter: m => m.statusReason[0].coding[0] },
        { title: 'Recorded', versions: '*', format: 'date', getter: m => m.extension.recorded }
      ],
      keyFn: m => m.id
  };
}

class MedicationDispenseVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Medication Dispenses',
    columns: [
        { title: 'Medication', versions: '*', format: 'code', getter: m => m.medicationCodeableConcept.coding[0] },
        { title: 'Handed Over Date', versions: '*', format: 'date', getter: m => m.whenHandedOver}
      ],
      keyFn: m => m.id
  };
}

export {
  PatientVisualizer,
  ConditionsVisualizer,
  ObservationsVisualizer,
  ReportsVisualizer,
  MedicationsVisualizer,
  AllergiesVisualizer,
  CarePlansVisualizer,
  ProceduresVisualizer,
  EncountersVisualizer,
  ImmunizationsVisualizer,
  DocumentReferencesVisualizer,
  ResourceVisualizer,
  ServiceRequestVisualizer,
  DeviceRequestVisualizer,
  CommunicationVisualizer,
  CoverageVisualizer,
  AdverseEventVisualizer,
  NutritionOrderVisualizer,
  MedicationRequestVisualizer,
  MedicationAdministrationVisualizer,
  MedicationDispenseVisualizer
};
