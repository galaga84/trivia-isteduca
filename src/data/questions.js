const QUESTIONS = [
  {
    text: "¿Cuál de las siguientes opciones describe correctamente qué es el fuego?",
    choices: [
      "Un evento accidental que siempre resulta en un incendio.",
      "Un fenómeno natural que ocurre únicamente en presencia de oxígeno puro.",
      "Un proceso de oxidación lenta que no genera calor ni luz.",
      "Una reacción química conocida como combustión que libera calor, luz y gases.",
    ],
    correctIndex: 3,
  },
  {
    text: "¿Cuáles son los elementos esenciales que permiten la combustión según el Triángulo del Fuego?",
    choices: [
      "Combustible, energía de activación y reacción en cadena",
      "Combustible, comburente y calor",
      "Combustible, comburente y reacción en cadena",
      "Combustible, oxígeno y energía de activación",
    ],
    correctIndex: 1,
  },
  {
    text: "¿Cuál es la principal diferencia entre el Triángulo del Fuego y el Tetraedro del Fuego?",
    choices: [
      "El Tetraedro del Fuego incorpora un cuarto elemento: la reacción en cadena.",
      "El Triángulo del Fuego representa llamas visibles, mientras que el Tetraedro no.",
      "El Triángulo del Fuego incluye la reacción en cadena, mientras que el Tetraedro no.",
      "El Triángulo del Fuego se utiliza para extinguir incendios, mientras que el Tetraedro no tiene aplicaciones prácticas.",
    ],
    correctIndex: 0,
  },
  {
    text: "¿Cuál de las siguientes opciones describe una pérdida indirecta causada por un incendio?",
    choices: [
      "Destrucción de bienes materiales",
      "Pérdida de clientes",
      "Lesiones personales",
      "Emisión de gases tóxicos",
    ],
    correctIndex: 1,
  },
   {
    text: "¿Cuál de las siguientes opciones describe correctamente el método de extinción conocido como 'sofocación'?",
    choices: [
      "Reducir la temperatura del fuego aplicando agua para absorber el calor.",
      "Disminuir la concentración de oxígeno en el área del fuego utilizando un gas más pesado o vapor de agua.",
      "Interrumpir la reacción química aplicando un inhibidor como el Polvo Químico Seco.",
      "Eliminar el combustible del área afectada para detener la combustión.",
    ],
    correctIndex: 1,
  },
  {
    text: "¿Cuál de las siguientes opciones describe correctamente el modelo causa - accidente - consecuencia?",
    choices: [
      "Un accidente es un evento fortuito que no puede ser prevenido ni analizado.",
      "Un accidente ocurre únicamente cuando hay daños materiales significativos.",
      "Un accidente es el resultado de una causa específica y siempre genera consecuencias.",
      "Un accidente ocurre sin ninguna causa previa y no tiene consecuencias.",
    ],
    correctIndex: 2,
  },
   {
    text: "¿Qué establece la NCh 934.Of94?",
    choices: [
      "La clasificación de los tipos de incendios según el material involucrado en la combustión.",
      "Los procedimientos para extinguir incendios en espacios confinados.",
      "Las normas de seguridad para la fabricación de extintores portátiles.",
      "Los requisitos para la instalación de sistemas de detección de incendios.",
    ],
    correctIndex: 0,
  },
  {
    text: "¿Cuál de las siguientes opciones describe correctamente una característica de los fuegos de Clase A?",
    choices: [
      "Involucran líquidos inflamables como gasolina o aceites.",
      "Se producen en materiales sólidos como madera, papel o tela.",
      "Ocurren en metales combustibles como magnesio o titanio.",
      "Están relacionados con equipos eléctricos energizados.",
    ],
    correctIndex: 1,
  },
  {
    text: "¿Cuál de las siguientes opciones describe correctamente las características de los fuegos de Clase B?",
    choices: [
      "Fuegos que involucran equipos eléctricos energizados.",
      "Fuegos que involucran materiales sólidos como madera y papel.",
      "Fuegos que involucran metales combustibles como magnesio y sodio.",
      "Fuegos que involucran líquidos inflamables como gasolina y aceites.",
    ],
    correctIndex: 3,
  },
   {
    text: "¿Cuál de las siguientes opciones describe correctamente las características de un fuego de Clase C?",
    choices: [
      "Fuegos que involucran líquidos inflamables como gasolina y aceites.",
      "Fuegos que involucran equipos eléctricos energizados.",
      "Fuegos que involucran metales combustibles como magnesio y titanio.",
      "Fuegos que involucran materiales sólidos como madera y papel.",
    ],
    correctIndex: 1,
  },
   {
    text: "¿Cuál de las siguientes opciones describe correctamente las características de un fuego de Clase D?",
    choices: [
      "Fuegos que involucran metales combustibles como magnesio o titanio.",
      "Fuegos que involucran materiales eléctricos energizados.",
      "Fuegos que involucran líquidos inflamables como gasolina o aceites.",
      "Fuegos que involucran materiales comunes como madera o papel.",
    ],
    correctIndex: 0,
  },
  {
    text: "¿Cuál es la característica principal de los incendios de Clase K?",
    choices: [
      "Están relacionados con aceites y grasas de cocina.",
      "Se originan en líquidos inflamables como gasolina y aceites.",
      "Involucran equipos eléctricos energizados.",
      "Involucran materiales sólidos como madera y papel.",
    ],
    correctIndex: 0,
  },
  {
    text: "¿Cuál es el primer paso del método de tres pasos para prevenir incendios?",
    choices: [
      "Actuar a tiempo.",
      "Reconocer el peligro.",
      "Eliminar el combustible.",
      "Decidir qué hacer.",
    ],
    correctIndex: 1,
  },
  {
    text: "¿Cuál de las siguientes acciones es fundamental para reconocer un peligro de incendio en un entorno laboral?",
    choices: [
      "Identificar materiales inflamables en el área.",
      "Confiar únicamente en los sistemas automáticos de detección.",
      "Esperar a que ocurra un incidente para analizarlo.",
      "Ignorar señales de advertencia como olores extraños o humo.",
    ],
    correctIndex: 0,
  },
  {
    text: "¿Cuál es el beneficio principal de actuar a tiempo en la prevención de incendios?",
    choices: [
      "Evitar que el fuego se propague y cause daños mayores.",
      "Asegurar que el fuego no vuelva a ocurrir en el futuro.",
      "Eliminar todos los elementos del fuego de manera inmediata.",
      "Garantizar que no se necesiten medidas de extinción.",
    ],
    correctIndex: 0,
  },
  {
    text: "¿A qué paso corresponden las preguntas sobre materiales combustibles cerca de fuentes de calor, cables dañados o extintores accesibles?",
    choices: [
      "Capacitación del personal.",
      "Reconocer el peligro.",
      "Mantenimiento de equipos.",
      "Planificación de evacuación.",
    ],
    correctIndex: 1,
  },
  {
    text: "¿A qué etapa corresponde el siguiente consejo: 'Si el riesgo es manejable, corrígelo de inmediato. Si requiere apoyo, reporta sin demora a quienes pueden intervenir'?",
    choices: [
      "Actúa a tiempo.",
      "Evalúa los riesgos.",
      "Identifica los riesgos.",
      "Monitorea los riesgos.",
    ],
    correctIndex: 0,
  },
];

export default QUESTIONS;
