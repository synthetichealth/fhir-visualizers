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
  numberWithCommas: (str) => str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
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

    const hasAddress = patient.address && patient.address[0];

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
                <dd>{ patient.name[0].family }, { patient.name[0].given.join(' ') }</dd>
              <dt>Gender</dt>
                <dd>{ patient.gender }</dd>
              <dt>Date of Birth</dt>
                <dd>{ patient.birthDate }</dd>
              <dt>Address</dt>
                <dd>{ hasAddress && patient.address[0].line.join(' ') }</dd>
              <dt>City, State</dt>
                <dd>{ hasAddress && patient.address[0].city }, { hasAddress && patient.address[0].state }</dd>
              <dt>Postal Code</dt>
                <dd>{ hasAddress && patient.address[0].postalCode }</dd>
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
          <tr className={this.props.rowClass || ''} key={this.props.keyFn(line)}>
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
      return <ConditionsVisualizer rows={this.props.rows} />;
    else if (resourceType === "Observation")
      return <ObservationsVisualizer rows={this.props.rows} />;
    else if (resourceType === "DiagnosticReport")
      return <ReportsVisualizer rows={this.props.rows} />;
    else if (resourceType === "MedicationRequest")
      return <MedicationsVisualizer rows={this.props.rows} />;
    else if (resourceType === "AllergyIntolerance")
      return <AllergiesVisualizer rows={this.props.rows} />;
    else if (resourceType === "CarePlan")
      return <CarePlansVisualizer rows={this.props.rows} />;
    else if (resourceType === "Procedure")
      return <ProceduresVisualizer rows={this.props.rows} />;
    else if (resourceType === "Encounter")
      return <EncountersVisualizer rows={this.props.rows} />;
    else if (resourceType === "Immunization")
      return <ImmunizationsVisualizer rows={this.props.rows} />;
  }
}


class ConditionsVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Conditions',
    columns: [
        { title: 'SNOMED', versions: '*', getter: c => c.code.coding[0].code },
        { title: 'Condition', versions: '*', getter: c => c.code.coding[0].display },
        { title: 'Date of Onset', versions: '*', format: 'date', getter: c => c.onsetDateTime },
        { title: 'Date Resolved', 'versions': '*', format: 'date', getter: c => c.abatementDateTime, defaultValue: 'N/A' }
      ],
      keyFn: c => c.id
  };
}


class ObservationsVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Observations',
    columns: [
        { title: 'LOINC', versions: '*', getter: o => o.code.coding[0].code },
        { title: 'Observation', versions: '*', getter: o => o.code.coding[0].display },
        { title: 'Value', versions: '*', getter: o => obsValue(o) },
        { title: 'Date Recorded', 'versions': '*', format: 'date', getter: o => o.effectiveDateTime }
      ],
      keyFn: o => o.id
  };
}


class ReportsVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Reports',
    columns: [
        { title: 'LOINC', versions: '*', getter: c => c.code.coding[0].code },
        { title: 'Report/Observation', versions: '*', getter: c => c.code.coding[0].display },
        { title: 'Value', versions: '*', getter: () => '' },
        { title: 'Date', 'versions': '*', format: 'date', getter: c => c.effectiveDateTime, defaultValue: 'N/A' }
      ],
    rowClass: 'report-line',
    nestedRows: [
      {
        getter: rpt => rpt.observations,
        keyFn: o => o.id,
        columns: [
          { title: 'LOINC', versions: '*', getter: o => o.code.coding[0].code },
          { title: 'Report/Observation', versions: '*', getter: o => o.code.coding[0].display },
          { title: 'Value', versions: '*', getter: o => obsValue(o) },
          SPACER
        ]
      },
      {
        getter: rpt => rpt.presentedForm,
        keyFn: p => Math.floor(Math.random() * 100), // TODO, pass in index
        columns: [
          SPACER,
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
        { title: 'RxNorm', versions: '*', getter: c => c.medicationCodeableConcept.coding[0].code },
        { title: 'Medication', versions: '*', getter: c => c.medicationCodeableConcept.coding[0].display },
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
        { title: 'SNOMED', versions: '*', getter: c => c.code.coding[0].code },
        { title: 'Allergy', versions: '*', getter: c => c.code.coding[0].display },
        { title: 'Date Recorded', versions: [R4], getter: c => c.recordedDate },
        { title: 'Date Recorded', versions: [DSTU2, STU3], format: 'date', getter: c => c.assertedDate },
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
        { title: 'SNOMED', versions: '*', getter: c => c.category[0].coding[0].code },
        { title: 'Care Plan', versions: '*', getter: c => c.category[0].coding[0].display },
        { title: 'Date', versions: '*', format: 'date', getter: c => c.period.start }
    ],
    nestedRows: [
      {
        getter: cp => cp.goals,
        keyFn: g => g.id,
        columns: [
          SPACER,
          { title: 'Goal', versions: [DSTU2], getter: g => `Goal: ${goalDescriptionDSTU2(g)}` },
          { title: 'Goal', versions: [STU3, R4], getter: g => `Goal: ${goalDescriptionSTU3R4(g)}` },
          SPACER
        ]
      },
      {
        getter: cp => cp.activity,
        keyFn: a => Math.random(),
        columns: [
          SPACER,
          { title: 'Activity', versions: '*', getter: a => `Activity: ${a.detail.code.coding[0].display}` },
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
        { title: 'SNOMED', versions: '*', getter: c => c.code.coding[0].code },
        { title: 'Procedure', versions: '*', getter: c => c.code.coding[0].display },
        { title: 'Date Performed', versions: '*', format: 'dateTime', getter: c => c.performedPeriod.start }
      ],
      keyFn: c => c.id
  };
}

class EncountersVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Encounters',
    columns: [
        { title: 'SNOMED', versions: '*', getter: e => e.type[0].coding[0].code },
        { title: 'Encounter', versions: '*', getter: e => e.type[0].coding[0].display },
        { title: 'Start Time', versions: '*', format: 'dateTime', getter: e => e.period.start },
        { title: 'Duration', 'versions': '*', getter: e => duration(e.period) }
      ],
      keyFn: c => c.id
  };
}

class ImmunizationsVisualizer extends GenericVisualizer {
  static defaultProps = {
    title: 'Vaccinations',
    columns: [
        { title: 'CVX', versions: '*', getter: c => c.vaccineCode.coding[0].code },
        { title: 'Vaccine', versions: '*', getter: c => c.vaccineCode.coding[0].display },
        { title: 'Date Given', versions: '*', format: 'date', getter: c => c.occurrenceDateTime },
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
  ResourceVisualizer
};
