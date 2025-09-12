import { safelyPrintError } from "@/common/utils/error-parsers";

type LogErrorType = {
  location: string;
  error: any;
  metadata?: Record<string, any>;
}

class ErrorHandler {
  logError = ({ location, error, metadata }: LogErrorType) => {
    console.debug(location, safelyPrintError(error), metadata);
  };
}

export default new ErrorHandler();
