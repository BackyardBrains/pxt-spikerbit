// Enums to be used in extension
enum Signal {
    EMG,
    EEG,
    ECG
}


//% color="#FF805E" icon="\uf188" weight=90 
namespace spikerbit {
    let buffer: number[] = [];
    let ecgTimestamps: number[] = [];
    let signalType: Signal = Signal.EMG
    let notInitialized = 1
    let envelopeValue: number = 0
    let tempCalculationValue: number = 0
    let lastSample = 0
    let bpmHeart: number = 0
    let beatHeart: number = 0
    let heartBeatHandler: () => void = null;
    const MAX_BUFFER_SIZE = 750;
    const NOISE_FLOOR = 580;
    const ENVELOPE_DECAY = 2;
    const ECG_TOP_THRESHOLD = 70
    const ECG_BOTTOM_THRESHOLD = -70
    const DEBOUNCE_PERIOD_ECG = 300
    const ECG_LPF_CUTOFF = 40
    const ECG_HPF_CUTOFF = 3


    // Filter notchCoefficients: [b0, b1, b2, a1, a2]
    let notchCoefficients: number[] = [0, 0, 0, 0, 0];
    // Buffers to keep the last two input and output samples for Notch
    let notchInputKeepBuffer: number[] = [0, 0];
    let notchOutputKeepBuffer: number[] = [0, 0];

    // Lpf Coefficients: [b0, b1, b2, a1, a2]
    let lpfCoefficients: number[] = [0, 0, 0, 0, 0];
    // Buffers to keep the last two input and output samples for lpf
    let lpfInputKeepBuffer: number[] = [0, 0];
    let lpfOutputKeepBuffer: number[] = [0, 0];

    // Hpf Coefficients: [b0, b1, b2, a1, a2]
    let hpfCoefficients: number[] = [0, 0, 0, 0, 0];
    // Buffers to keep the last two input and output samples for lpf
    let hpfInputKeepBuffer: number[] = [0, 0];
    let hpfOutputKeepBuffer: number[] = [0, 0];


    // Filter parameters
    const SAMPLING_RATE: number = 250;       // Hz
    const ALPHA_WAVE_FREQUENCY: number = 10;     // Hz (Notch frequency)
    const Q_NOTCH: number = 1;                   // Quality factor
    const Q_LPF_HPF: number = 0.5;                   // Quality factor
    const BASELINE_ALPHA: number = 20;

    let eegSignalPower: number = 0;
    let eegNotchedSignalPower: number = 0;
    let filteredValue: number = 0;
    let eegAlphaPower: number = 0;

    /**
     * Calculate intermediate variables and set filter notchCoefficients
     */
    function calculateNotchCoefficients(Fc: number, Q: number, Fs: number): void {
        const omega = (2 * Math.PI * Fc) / Fs;
        const omegaS = Math.sin(omega);
        const omegaC = Math.cos(omega);
        const alpha = omegaS / (2 * Q);

        const a0 = 1 + alpha;
        const b0 = 1 / a0;
        const b1 = (-2 * omegaC) / a0;
        const b2 = 1 / a0;
        const a1 = (-2 * omegaC) / a0;
        const a2 = (1 - alpha) / a0;

        // Set the Coefficients array
        notchCoefficients[0] = b0;
        notchCoefficients[1] = b1;
        notchCoefficients[2] = b2;
        notchCoefficients[3] = a1;
        notchCoefficients[4] = a2;
    }


    function calculateLPFCoefficients(Fc: number, Q: number, Fs: number): void {
        const omega = (2 * Math.PI * Fc) / Fs;
        const omegaS = Math.sin(omega);
        const omegaC = Math.cos(omega);
        const alpha = omegaS / (2 * Q);

        const a0 = 1 + alpha;
        const b0 = ((1 - omegaC) / 2) / a0;
        const b1 = ((1 - omegaC)) / a0;
        const b2 = ((1 - omegaC) / 2) / a0;
        const a1 = (-2 * omegaC) / a0;
        const a2 = (1 - alpha) / a0;



        // Set the coefficients array
        lpfCoefficients[0] = b0;
        lpfCoefficients[1] = b1;
        lpfCoefficients[2] = b2;
        lpfCoefficients[3] = a1;
        lpfCoefficients[4] = a2;
    }


    function calculateHPFCoefficients(Fc: number, Q: number, Fs: number): void {
        const omega = (2 * Math.PI * Fc) / Fs;
        const omegaS = Math.sin(omega);
        const omegaC = Math.cos(omega);
        const alpha = omegaS / (2 * Q);

        const a0 = 1 + alpha;
        const b0 = ((1 + omegaC) / 2) / a0;
        const b1 = (-1 * (1 + omegaC)) / a0;
        const b2 = ((1 + omegaC) / 2) / a0;
        const a1 = (-2 * omegaC) / a0;
        const a2 = (1 - alpha) / a0;


        // Set the coefficients array
        hpfCoefficients[0] = b0;
        hpfCoefficients[1] = b1;
        hpfCoefficients[2] = b2;
        hpfCoefficients[3] = a1;
        hpfCoefficients[4] = a2;
    }


    /**
    * Notch filter a single input sample and return the filtered output
    * @param inputValue The input sample to be filtered
    * @returns The filtered output sample
    */
    export function notchFilterSingleSample(inputValue: number): number {
        // Compute the filtered output using the difference equation:
        // y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
        const y = (notchCoefficients[0] * inputValue) +
            (notchCoefficients[1] * notchInputKeepBuffer[0]) +
            (notchCoefficients[2] * notchInputKeepBuffer[1]) -
            (notchCoefficients[3] * notchOutputKeepBuffer[0]) -
            (notchCoefficients[4] * notchOutputKeepBuffer[1]);

        // Update the input buffer (shift the samples)
        notchInputKeepBuffer[1] = notchInputKeepBuffer[0];
        notchInputKeepBuffer[0] = inputValue;

        // Update the output buffer (shift the samples)
        notchOutputKeepBuffer[1] = notchOutputKeepBuffer[0];
        notchOutputKeepBuffer[0] = y;

        return y | 0;
    }


    /**
    * Low pass Filter a single input sample and return the filtered output
    * @param inputValue The input sample to be filtered
    * @returns The filtered output sample
    */
    export function lpfFilterSingleSample(inputValue: number): number {
        // Compute the filtered output using the difference equation:
        // y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
        const y = (lpfCoefficients[0] * inputValue) +
            (lpfCoefficients[1] * lpfInputKeepBuffer[0]) +
            (lpfCoefficients[2] * lpfInputKeepBuffer[1]) -
            (lpfCoefficients[3] * lpfOutputKeepBuffer[0]) -
            (lpfCoefficients[4] * lpfOutputKeepBuffer[1]);

        // Update the input buffer (shift the samples)
        lpfInputKeepBuffer[1] = lpfInputKeepBuffer[0];
        lpfInputKeepBuffer[0] = inputValue;

        // Update the output buffer (shift the samples)
        lpfOutputKeepBuffer[1] = lpfOutputKeepBuffer[0];
        lpfOutputKeepBuffer[0] = y;

        return y | 0;
    }


    /**
    * High pass Filter a single input sample and return the filtered output
    * @param inputValue The input sample to be filtered
    * @returns The filtered output sample
    */
    export function hpfFilterSingleSample(inputValue: number): number {
        // Compute the filtered output using the difference equation:
        // y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
        const y = (hpfCoefficients[0] * inputValue) +
            (hpfCoefficients[1] * hpfInputKeepBuffer[0]) +
            (hpfCoefficients[2] * hpfInputKeepBuffer[1]) -
            (hpfCoefficients[3] * hpfOutputKeepBuffer[0]) -
            (hpfCoefficients[4] * hpfOutputKeepBuffer[1]);

        // Update the input buffer (shift the samples)
        hpfInputKeepBuffer[1] = hpfInputKeepBuffer[0];
        hpfInputKeepBuffer[0] = inputValue;

        // Update the output buffer (shift the samples)
        hpfOutputKeepBuffer[1] = hpfOutputKeepBuffer[0];
        hpfOutputKeepBuffer[0] = y;

        return y | 0;
    }

    // Define your background function
    function backgroundTask(): void {
        while (true) {

            lastSample = tempCalculationValue
            tempCalculationValue = pins.analogReadPin(AnalogPin.P1)
            if (signalType == Signal.ECG) {
                buffer.push(tempCalculationValue);

                if (buffer.length > MAX_BUFFER_SIZE) {
                    buffer.removeAt(0)
                }

                tempCalculationValue = lpfFilterSingleSample(tempCalculationValue)
                tempCalculationValue = hpfFilterSingleSample(tempCalculationValue)
                beatHeart = 0;
                if (tempCalculationValue > ECG_TOP_THRESHOLD || tempCalculationValue < ECG_BOTTOM_THRESHOLD) {
                    let currentMillis = control.millis()
                    if (ecgTimestamps.length > 0) {
                        if ((currentMillis - ecgTimestamps[ecgTimestamps.length - 1]) > DEBOUNCE_PERIOD_ECG) {
                            ecgTimestamps.push(currentMillis)
                            beatHeart = 1;
                        }
                    }
                    else {
                        ecgTimestamps.push(currentMillis)
                        beatHeart = 1;
                    }

                    if (ecgTimestamps.length > 3) {
                        ecgTimestamps.removeAt(0)
                        bpmHeart = (120000 / (ecgTimestamps[2] - ecgTimestamps[1] + ecgTimestamps[1] - ecgTimestamps[0])) | 0

                    }

                }

                if (beatHeart && heartBeatHandler) {
                    heartBeatHandler();
                }
            }
            else if (signalType == Signal.EMG) {
                tempCalculationValue = tempCalculationValue - NOISE_FLOOR;
                if (tempCalculationValue > 0) {
                    if (tempCalculationValue > envelopeValue) {
                        envelopeValue = tempCalculationValue;
                    }
                }

                envelopeValue = envelopeValue - ENVELOPE_DECAY;

                if (envelopeValue < 0) {
                    envelopeValue = 0;
                }

                buffer.push(envelopeValue);

                if (buffer.length > MAX_BUFFER_SIZE) {
                    buffer.removeAt(0)
                }
            }
            else if (signalType = Signal.EEG) {
                buffer.push(tempCalculationValue);

                if (buffer.length > MAX_BUFFER_SIZE) {
                    buffer.removeAt(0)
                }
                eegSignalPower = eegSignalPower * 0.99 + 0.01 * (Math.abs(tempCalculationValue - 512))
                filteredValue = notchFilterSingleSample(tempCalculationValue)
                eegNotchedSignalPower = eegNotchedSignalPower * 0.99 + 0.01 * (Math.abs(filteredValue - 512))
                eegAlphaPower = (eegSignalPower - eegNotchedSignalPower) - BASELINE_ALPHA;
                if (eegAlphaPower < 0) {
                    eegAlphaPower = 0;
                }
            }

            basic.pause(0)
        }
    }



    /**
     * Start recording EMG signal 
     */

    //% group="Muscle"
    //% weight=41
    //% block="start muscle recording"
    export function startMuscleRecording(): void {
        signalType = Signal.EMG;
        pins.digitalWritePin(DigitalPin.P8, 0)
        pins.digitalWritePin(DigitalPin.P9, 0)
        if (notInitialized) {
            control.inBackground(() => {
                backgroundTask()
            })
        }
    }

    /**
     * Return last envelope value
     */

    //% group="Muscle"
    //% weight=40
    //% block="muscle power signal"
    export function musclePowerSignal(): number {
        if (signalType == Signal.EMG) {
            return envelopeValue;
        }
        else {
            return 0;
        }
    }

    /**
     * Start recording ECG signal
     */

    //% group="Heart"
    //% weight=53
    //% block="start heart recording"
    export function startHeartRecording(): void {
        signalType = Signal.ECG;
        calculateLPFCoefficients(ECG_LPF_CUTOFF, Q_LPF_HPF, SAMPLING_RATE)
        calculateHPFCoefficients(ECG_HPF_CUTOFF, Q_LPF_HPF, SAMPLING_RATE);
        pins.digitalWritePin(DigitalPin.P8, 1)
        pins.digitalWritePin(DigitalPin.P9, 0)
        if (notInitialized) {
            control.inBackground(() => {
                backgroundTask()
            })
        }
    }



    /**
     * Return last measured value of the ECG signal
     */

    //% group="Heart"
    //% weight=52
    //% block="heart signal"
    export function heartSignal(): number {
        if (buffer.length > 0 && signalType == Signal.ECG) {
            return buffer[buffer.length - 1];
        }
        else {
            return 0;
        }
    }

    /**
     * Return heart rate
     */

    //% group="Heart"
    //% weight=51
    //% block="heart rate"
    export function heartRate(): number {
        if (signalType == Signal.ECG) {
            return bpmHeart;
        }
        else {
            return 0;
        }
    }

    /**
     * Run events based on on the heartbeat
     */

    //% group="Heart"
    //% weight=50
    //% block="on heartbeat"
    export function onHeartBeat(handler: () => void): void {
        heartBeatHandler = handler;
    }

    /**
     * Start recording EEG signal
     */

    //% group="Brain"
    //% weight=62
    //% block="start brain recording"
    export function startBrainRecording(): void {
        signalType = Signal.EEG;
        calculateNotchCoefficients(ALPHA_WAVE_FREQUENCY, Q_NOTCH, SAMPLING_RATE);
        pins.digitalWritePin(DigitalPin.P8, 0)
        pins.digitalWritePin(DigitalPin.P9, 1)
        if (notInitialized) {
            control.inBackground(() => {
                backgroundTask()
            })
        }
    }

    /**
     * Return last measured value of the EEG signal
     */

    //% group="Brain"
    //% weight=61
    //% block="brain signal"
    export function brainSignal(): number {
        if (buffer.length > 0 && signalType == Signal.EEG) {
            return buffer[buffer.length - 1];
        }
        else {
            return 0;
        }
    }

    /**
         * Return alpha waves power
         */

    //% group="Brain"
    //% weight=60
    //% block="brain alpha power"
    export function brainAlphaPower(): number {
        if (signalType == Signal.EEG) {
            return eegAlphaPower;
        }
        else {
            return 0;
        }
    }


    /**
     * Print number provided as input parameter
     */

    //% group="Helper Utility"
    //% weight=74
    //% block="print %value"
    export function print(value: number): void {
        serial.writeValue("Signal", value);
    }


    /**
     * Return tree seconds of recorded signal
     */

    //% group="Helper Utility"
    //% weight=73
    //% block="signal block || in last $durationMs (ms)"
    //% durationMs.defl = 3000
    export function signalBlock(durationMs?: number): number[] {
        control.assert(durationMs >= 0 || durationMs <= 3000, "Spikerbit error")

        // Calculate number of samples
        let numSamples = Math.floor(durationMs / 4);

        // Get only the first `numSamples` elements from `buffer`
        const bufferSlice = buffer.slice(Math.max(buffer.length - numSamples, 0));

        return bufferSlice;
    }


    /**
     * Returns max value of signal for the specified duration in milliseconds.
     * Uses an internal buffer sampled at 250 Hz. 
     */

    //% group="Helper Utility"
    //% weight=72
    //% block="max signal in last $durationMs ms"
    export function maxSignalInLast(durationMs: number): number {

        let numSamples = Math.floor(durationMs / 4);  // Calculate number of samples

        // Get only the first `numSamples` elements from `buffer`
        const bufferSlice = buffer.slice(Math.max(buffer.length - numSamples, 0));

        // Calculate the max value in this slice
        return bufferSlice.reduce((max, current) => current > max ? current : max, -Infinity);
    }



    /**
     * Returns number of peaks of signal for the specified duration in milliseconds.
     * Uses an internal buffer sampled at 250 Hz.
     */

    //% group="Helper Utility"
    //% weight=71
    //% block="number of peaks in last $durationMs ms"
    export function numPeaksInLast(durationMs: number): number {

        // Get only the first `numSamples` elements from `buffer`
        const numSamples = Math.floor(durationMs / 4);  // Calculate number of samples
        const bufferSlice = buffer.slice(Math.max(buffer.length - numSamples, 0));

        let baseline = 0;
        let prevValue = -Infinity;
        let rising = false;
        let peak = -1;
        let steps = 20;
        let counter = 0;

        for (let value of bufferSlice) {

            // The singal is in the rising phase
            if (value > prevValue) {
                rising = true;
                peak = -1;
            } else {
                // Check ONLY IF rising happened before falling
                if (rising) {

                    // Get the peak point
                    if (peak == -1) {
                        peak = prevValue;
                    }

                    // Increase the counter ONLY IF current signal is 
                    // 'ENVELOPE_DECAY' * 'steps' away from the peak
                    if (peak - value > ENVELOPE_DECAY * steps) {
                        counter++;
                        rising = false;
                    }
                }
            }

            // Update the previous signal
            prevValue = value;
        }

        return counter;

    }

}