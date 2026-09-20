using System;
using System.IO;
using System.Runtime.InteropServices;

namespace AudioDecoder {
    [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("70ae66f2-c809-4e4f-8915-bdcb406b7993")]
    interface IMFSourceReader {
        void GetStreamSelection(uint dwStreamIndex, [MarshalAs(UnmanagedType.Bool)] out bool pSelected);
        void SetStreamSelection(uint dwStreamIndex, [MarshalAs(UnmanagedType.Bool)] bool bSelected);
        void GetNativeMediaType(uint dwStreamIndex, uint dwMediaTypeIndex, out IntPtr ppMediaType);
        void GetCurrentMediaType(uint dwStreamIndex, out IntPtr ppMediaType);
        void SetCurrentMediaType(uint dwStreamIndex, IntPtr pdwReserved, IMFMediaType pMediaType);
        void SetStreamPosition(ref Guid pguidTimeFormat, IntPtr pvarStartPosition);
        void ReadSample(uint dwStreamIndex, uint dwControlFlags, out uint pdwActualStreamIndex, out uint pdwStreamFlags, out ulong pllTimestamp, out IntPtr ppSample);
        void Flush(uint dwStreamIndex);
        void GetServiceForStream(uint dwStreamIndex, ref Guid guidService, ref Guid riid, out IntPtr ppvObject);
        void GetPresentationAttribute(uint dwStreamIndex, ref Guid guidAttribute, IntPtr pvarAttribute);
    }

    [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("44ae0fa8-ea31-4109-8d2e-4cae4997c555")]
    interface IMFMediaType {
        // We only need SetGUID and SetUINT32 from IMFAttributes
        void GetItem(ref Guid guidKey, IntPtr pValue);
        void GetItemType(ref Guid guidKey, out int pType);
        void CompareItem(ref Guid guidKey, IntPtr Value, [MarshalAs(UnmanagedType.Bool)] out bool pbResult);
        void Compare(IntPtr pType, int CompareType, [MarshalAs(UnmanagedType.Bool)] out bool pbResult);
        void GetUINT32(ref Guid guidKey, out uint punValue);
        void GetUINT64(ref Guid guidKey, out ulong punValue);
        void GetDouble(ref Guid guidKey, out double pdfValue);
        void GetGUID(ref Guid guidKey, out Guid pguidValue);
        void GetStringLength(ref Guid guidKey, out uint pcchLength);
        void GetString(ref Guid guidKey, [MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pwszValue, uint cchBufSize, out uint pcchLength);
        void GetAllocatedString(ref Guid guidKey, [MarshalAs(UnmanagedType.LPWStr)] out string ppwszValue, out uint pcchLength);
        void GetBlobSize(ref Guid guidKey, out uint pcbBlobSize);
        void GetBlob(ref Guid guidKey, [Out, MarshalAs(UnmanagedType.LPArray)] byte[] pBuf, uint cbBufSize, out uint pcbBlobSize);
        void GetAllocatedBlob(ref Guid guidKey, out IntPtr ppBuf, out uint pcbSize);
        void GetUnknown(ref Guid guidKey, ref Guid riid, out IntPtr ppv);
        void SetItem(ref Guid guidKey, IntPtr Value);
        void DeleteItem(ref Guid guidKey);
        void DeleteAllItems();
        void SetUINT32(ref Guid guidKey, uint unValue);
        void SetUINT64(ref Guid guidKey, ulong unValue);
        void SetDouble(ref Guid guidKey, double dfValue);
        void SetGUID(ref Guid guidKey, ref Guid guidValue);
        void SetString(ref Guid guidKey, [MarshalAs(UnmanagedType.LPWStr)] string wszValue);
        void SetBlob(ref Guid guidKey, [MarshalAs(UnmanagedType.LPArray)] byte[] pBuf, uint cbBufSize);
        void SetUnknown(ref Guid guidKey, IntPtr pUnknown);
        void LockStore();
        void UnlockStore();
        void GetCount(out uint pcItems);
        void GetItemByIndex(uint unIndex, out Guid pGuidKey, IntPtr pValue);
        void CopyAllItems(IntPtr pDest);
    }

    [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("c40a00f2-b93a-4d80-ae8c-5a1c634f58e4")]
    interface IMFSample {
        // IMFAttributes methods
        void GetItem(ref Guid guidKey, IntPtr pValue);
        void GetItemType(ref Guid guidKey, out int pType);
        void CompareItem(ref Guid guidKey, IntPtr Value, [MarshalAs(UnmanagedType.Bool)] out bool pbResult);
        void Compare(IntPtr pType, int CompareType, [MarshalAs(UnmanagedType.Bool)] out bool pbResult);
        void GetUINT32(ref Guid guidKey, out uint punValue);
        void GetUINT64(ref Guid guidKey, out ulong punValue);
        void GetDouble(ref Guid guidKey, out double pdfValue);
        void GetGUID(ref Guid guidKey, out Guid pguidValue);
        void GetStringLength(ref Guid guidKey, out uint pcchLength);
        void GetString(ref Guid guidKey, [MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pwszValue, uint cchBufSize, out uint pcchLength);
        void GetAllocatedString(ref Guid guidKey, [MarshalAs(UnmanagedType.LPWStr)] out string ppwszValue, out uint pcchLength);
        void GetBlobSize(ref Guid guidKey, out uint pcbBlobSize);
        void GetBlob(ref Guid guidKey, [Out, MarshalAs(UnmanagedType.LPArray)] byte[] pBuf, uint cbBufSize, out uint pcbBlobSize);
        void GetAllocatedBlob(ref Guid guidKey, out IntPtr ppBuf, out uint pcbSize);
        void GetUnknown(ref Guid guidKey, ref Guid riid, out IntPtr ppv);
        void SetItem(ref Guid guidKey, IntPtr Value);
        void DeleteItem(ref Guid guidKey);
        void DeleteAllItems();
        void SetUINT32(ref Guid guidKey, uint unValue);
        void SetUINT64(ref Guid guidKey, ulong unValue);
        void SetDouble(ref Guid guidKey, double dfValue);
        void SetGUID(ref Guid guidKey, ref Guid guidValue);
        void SetString(ref Guid guidKey, [MarshalAs(UnmanagedType.LPWStr)] string wszValue);
        void SetBlob(ref Guid guidKey, [MarshalAs(UnmanagedType.LPArray)] byte[] pBuf, uint cbBufSize);
        void SetUnknown(ref Guid guidKey, IntPtr pUnknown);
        void LockStore();
        void UnlockStore();
        void GetCount(out uint pcItems);
        void GetItemByIndex(uint unIndex, out Guid pGuidKey, IntPtr pValue);
        void CopyAllItems(IntPtr pDest);

        // IMFSample methods
        void GetSampleFlags(out uint pdwSampleFlags);
        void SetSampleFlags(uint dwSampleFlags);
        void GetSampleTime(out ulong phnsSampleTime);
        void SetSampleTime(ulong hnsSampleTime);
        void GetSampleDuration(out ulong phnsSampleDuration);
        void SetSampleDuration(ulong hnsSampleDuration);
        void GetBufferCount(out uint pdwBufferCount);
        void GetBufferByIndex(uint dwIndex, out IntPtr ppBuffer);
        void ConvertToContiguousBuffer(out IntPtr ppBuffer);
        void AddBuffer(IntPtr pBuffer);
        void RemoveBufferByIndex(uint dwIndex);
        void RemoveAllBuffers();
        void GetTotalLength(out uint pcbTotalLength);
        void SetSampleDuration(ref ulong phnsSampleDuration);
    }

    [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("045db597-e442-45bb-a5cc-4da7ae6f56cb")]
    interface IMFMediaBuffer {
        void Lock(out IntPtr ppbBuffer, out uint pcbMaxLength, out uint pcbCurrentLength);
        void Unlock();
        void GetCurrentLength(out uint pcbCurrentLength);
        void SetCurrentLength(uint cbCurrentLength);
        void GetMaxLength(out uint pcbMaxLength);
    }

    class Program {
        [DllImport("mfplat.dll", ExactSpelling = true)]
        static extern int MFStartup(uint version, uint flags);
        [DllImport("mfplat.dll", ExactSpelling = true)]
        static extern int MFShutdown();
        [DllImport("mfplat.dll", ExactSpelling = true)]
        static extern int MFCreateMediaType(out IMFMediaType ppMFType);
        [DllImport("mfreadwrite.dll", ExactSpelling = true)]
        static extern int MFCreateSourceReaderFromURL([MarshalAs(UnmanagedType.LPWStr)] string pwszURL, IntPtr pAttributes, out IMFSourceReader ppSourceReader);

        static readonly Guid MF_MT_MAJOR_TYPE = new Guid("48e36e17-a440-4a49-9922-6e6e652d28d8");
        static readonly Guid MF_MT_SUBTYPE = new Guid("f7e34c9a-42e8-4714-b74b-cb29d72c35e5");
        static readonly Guid MFMediaType_Audio = new Guid("73647561-0000-0010-8000-00aa00389b71");
        static readonly Guid MFAudioFormat_PCM = new Guid("00000001-0000-0010-8000-00aa00389b71");
        static readonly Guid MF_MT_AUDIO_NUM_CHANNELS = new Guid("37e5812e-74b9-470a-a0e0-000000000000"); // placeholder
        static readonly Guid MF_MT_AUDIO_SAMPLES_PER_SECOND = new Guid("5faeeae7-0290-4c31-9e8a-c534f68d9dba");
        static readonly Guid MF_MT_AUDIO_BITS_PER_SAMPLE = new Guid("f2def901-aca6-4702-a80d-cb323b0e5ea9");

        const uint MF_SOURCE_READER_FIRST_AUDIO_STREAM = 0xFFFFFFFD;

        static void Main(string[] args) {
            string inputFile = args.Length > 0 ? args[0] : @"audio\rain.mp3";
            string outputFile = args.Length > 1 ? args[1] : @"scratch\rain.wav";

            MFStartup(0x00020070, 0);

            IMFSourceReader reader;
            int hr = MFCreateSourceReaderFromURL(Path.GetFullPath(inputFile), IntPtr.Zero, out reader);
            if (hr != 0) {
                Console.WriteLine("Failed to open source reader: 0x" + hr.ToString("X8"));
                return;
            }

            IMFMediaType pcmType;
            MFCreateMediaType(out pcmType);
            Guid majorKey = MF_MT_MAJOR_TYPE;
            Guid majorVal = MFMediaType_Audio;
            Guid subKey = MF_MT_SUBTYPE;
            Guid subVal = MFAudioFormat_PCM;
            pcmType.SetGUID(ref majorKey, ref majorVal);
            pcmType.SetGUID(ref subKey, ref subVal);

            reader.SetCurrentMediaType(MF_SOURCE_READER_FIRST_AUDIO_STREAM, IntPtr.Zero, pcmType);

            // Read actual media type configured
            IntPtr curTypePtr;
            reader.GetCurrentMediaType(MF_SOURCE_READER_FIRST_AUDIO_STREAM, out curTypePtr);
            IMFMediaType curType = (IMFMediaType)Marshal.GetObjectForIUnknown(curTypePtr);

            Guid MF_MT_AUDIO_NUM_CHANNELS_GUID = new Guid("37e5812e-74b9-470a-a0e0-000000000000");
            Guid rateKey = MF_MT_AUDIO_SAMPLES_PER_SECOND;
            Guid bitsKey = MF_MT_AUDIO_BITS_PER_SAMPLE;
            uint channels = 2;
            uint sampleRate = 44100;
            uint bitsPerSample = 16;
            try { curType.GetUINT32(ref MF_MT_AUDIO_NUM_CHANNELS_GUID, out channels); } catch {}
            try { curType.GetUINT32(ref rateKey, out sampleRate); } catch {}
            try { curType.GetUINT32(ref bitsKey, out bitsPerSample); } catch {}
            Marshal.Release(curTypePtr);

            Console.WriteLine(string.Format("Decoded format: {0} channels, {1} Hz, {2} bit", channels, sampleRate, bitsPerSample));

            using (MemoryStream pcmStream = new MemoryStream()) {
                while (true) {
                    uint streamIndex, flags;
                    ulong timestamp;
                    IntPtr samplePtr;
                    reader.ReadSample(MF_SOURCE_READER_FIRST_AUDIO_STREAM, 0, out streamIndex, out flags, out timestamp, out samplePtr);
                    if ((flags & 0x00000001) != 0) break; // MF_SOURCE_READERF_ENDOFSTREAM
                    if (samplePtr == IntPtr.Zero) continue;

                    IMFSample sample = (IMFSample)Marshal.GetObjectForIUnknown(samplePtr);
                    IntPtr bufferPtr;
                    sample.ConvertToContiguousBuffer(out bufferPtr);
                    IMFMediaBuffer buffer = (IMFMediaBuffer)Marshal.GetObjectForIUnknown(bufferPtr);

                    IntPtr pData;
                    uint maxLen, curLen;
                    buffer.Lock(out pData, out maxLen, out curLen);
                    byte[] data = new byte[curLen];
                    Marshal.Copy(pData, data, 0, (int)curLen);
                    buffer.Unlock();

                    pcmStream.Write(data, 0, data.Length);

                    Marshal.Release(bufferPtr);
                    Marshal.Release(samplePtr);
                }

                byte[] pcm = pcmStream.ToArray();
                Console.WriteLine("Total PCM bytes: " + pcm.Length + " (" + (pcm.Length / (channels * (bitsPerSample / 8) * sampleRate)).ToString() + " sec)");

                // Analyze 1-second chunks energy/amplitude
                int bytesPerSec = (int)(channels * (bitsPerSample / 8) * sampleRate);
                int totalSec = pcm.Length / bytesPerSec;
                Console.WriteLine("\n--- Energy Profile Over Time (RMS per 5 sec) ---");
                for (int s = 0; s < totalSec; s += 5) {
                    double sumSquare = 0;
                    int count = 0;
                    int startByte = s * bytesPerSec;
                    int endByte = Math.Min(pcm.Length - 2, (s + 5) * bytesPerSec);
                    for (int i = startByte; i < endByte; i += 2) {
                        short sample = BitConverter.ToInt16(pcm, i);
                        double norm = sample / 32768.0;
                        sumSquare += norm * norm;
                        count++;
                    }
                    double rms = Math.Sqrt(sumSquare / count);
                    Console.WriteLine(string.Format("{0:D3}s - {1:D3}s : RMS = {2:F4} {3}", s, s + 5, rms, rms < 0.005 ? "[SILENCE!]" : ""));
                }

                // Check first 2 seconds and last 2 seconds RMS
                double firstSecRms = 0;
                int fCount = 0;
                for (int i = 0; i < Math.Min(pcm.Length - 2, bytesPerSec * 2); i += 2) {
                    short val = BitConverter.ToInt16(pcm, i);
                    double norm = val / 32768.0;
                    firstSecRms += norm * norm;
                    fCount++;
                }
                firstSecRms = Math.Sqrt(firstSecRms / fCount);

                double lastSecRms = 0;
                int lCount = 0;
                int lStart = Math.Max(0, pcm.Length - bytesPerSec * 2);
                for (int i = lStart; i < pcm.Length - 2; i += 2) {
                    short val = BitConverter.ToInt16(pcm, i);
                    double norm = val / 32768.0;
                    lastSecRms += norm * norm;
                    lCount++;
                }
                lastSecRms = Math.Sqrt(lastSecRms / lCount);

                Console.WriteLine("\nFirst 2 sec RMS: " + firstSecRms.ToString("F4"));
                Console.WriteLine("Last 2 sec RMS:  " + lastSecRms.ToString("F4"));

                // Write WAV file
                using (FileStream fs = new FileStream(outputFile, FileMode.Create))
                using (BinaryWriter bw = new BinaryWriter(fs)) {
                    bw.Write(System.Text.Encoding.ASCII.GetBytes("RIFF"));
                    bw.Write((uint)(36 + pcm.Length));
                    bw.Write(System.Text.Encoding.ASCII.GetBytes("WAVE"));
                    bw.Write(System.Text.Encoding.ASCII.GetBytes("fmt "));
                    bw.Write((uint)16);
                    bw.Write((ushort)1); // PCM
                    bw.Write((ushort)channels);
                    bw.Write((uint)sampleRate);
                    bw.Write((uint)(sampleRate * channels * (bitsPerSample / 8)));
                    bw.Write((ushort)(channels * (bitsPerSample / 8)));
                    bw.Write((ushort)bitsPerSample);
                    bw.Write(System.Text.Encoding.ASCII.GetBytes("data"));
                    bw.Write((uint)pcm.Length);
                    bw.Write(pcm);
                }
                Console.WriteLine("WAV file written: " + outputFile);
            }

            MFShutdown();
        }
    }
}
