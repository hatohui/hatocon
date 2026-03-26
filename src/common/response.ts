import { NextResponse } from "next/server";

const OK = (data?: unknown) =>
  NextResponse.json(
    {
      status: status.OK,
      message: messages.OK,
      data,
    },
    { status: status.OK },
  );

const Unauthorized = (message?: string) =>
  NextResponse.json(
    {
      status: status.Unauthorized,
      message: message || messages.Unauthorized,
    },
    { status: status.Unauthorized },
  );

const Forbidden = (message?: string) =>
  NextResponse.json(
    {
      status: status.Forbidden,
      message: message || messages.Forbidden,
    },
    { status: status.Forbidden },
  );

const NotFound = (message?: string) =>
  NextResponse.json(
    {
      status: status.NotFound,
      message: message || messages.NotFound,
    },
    { status: status.NotFound },
  );

const BadRequest = (message?: string) =>
  NextResponse.json(
    {
      status: status.BadRequest,
      message: message || messages.BadRequest,
    },
    { status: status.BadRequest },
  );

const Created = (data?: unknown) =>
  NextResponse.json(
    {
      status: status.Created,
      message: messages.Created,
      data,
    },
    { status: status.Created },
  );

const NoContent = () => new NextResponse(null, { status: status.NoContent });

const Conflict = (message?: string) =>
  NextResponse.json(
    {
      status: status.Conflict,
      message: message || messages.Conflict,
    },
    { status: status.Conflict },
  );

const UnprocessableEntity = (message?: string) =>
  NextResponse.json(
    {
      status: status.UnprocessableEntity,
      message: message || messages.UnprocessableEntity,
    },
    { status: status.UnprocessableEntity },
  );

const TooManyRequests = (message?: string) =>
  NextResponse.json(
    {
      status: status.TooManyRequests,
      message: message || messages.TooManyRequests,
    },
    { status: status.TooManyRequests },
  );

const InternalServerError = (message?: string) =>
  NextResponse.json(
    {
      status: status.InternalServerError,
      message: message || messages.InternalServerError,
    },
    { status: status.InternalServerError },
  );

const ServiceUnavailable = (message?: string) =>
  NextResponse.json(
    {
      status: status.ServiceUnavailable,
      message: message || messages.ServiceUnavailable,
    },
    { status: status.ServiceUnavailable },
  );

const MethodNotAllowed = (message?: string) =>
  NextResponse.json(
    {
      status: status.MethodNotAllowed,
      message: message || messages.MethodNotAllowed,
    },
    { status: status.MethodNotAllowed },
  );

const RequestTimeout = (message?: string) =>
  NextResponse.json(
    {
      status: status.RequestTimeout,
      message: message || messages.RequestTimeout,
    },
    { status: status.RequestTimeout },
  );

const Gone = (message?: string) =>
  NextResponse.json(
    {
      status: status.Gone,
      message: message || messages.Gone,
    },
    { status: status.Gone },
  );

const UnsupportedMediaType = (message?: string) =>
  NextResponse.json(
    {
      status: status.UnsupportedMediaType,
      message: message || messages.UnsupportedMediaType,
    },
    { status: status.UnsupportedMediaType },
  );

const NotImplemented = (message?: string) =>
  NextResponse.json(
    {
      status: status.NotImplemented,
      message: message || messages.NotImplemented,
    },
    { status: status.NotImplemented },
  );

const BadGateway = (message?: string) =>
  NextResponse.json(
    {
      status: status.BadGateway,
      message: message || messages.BadGateway,
    },
    { status: status.BadGateway },
  );

export {
  OK,
  Created,
  NoContent,
  Unauthorized,
  Forbidden,
  NotFound,
  MethodNotAllowed,
  RequestTimeout,
  Gone,
  BadRequest,
  Conflict,
  UnprocessableEntity,
  UnsupportedMediaType,
  TooManyRequests,
  InternalServerError,
  NotImplemented,
  BadGateway,
  ServiceUnavailable,
};

const messages = {
  OK: "OK",
  Created: "CREATED",
  NotFound: "NOT_FOUND",
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  MethodNotAllowed: "METHOD_NOT_ALLOWED",
  RequestTimeout: "REQUEST_TIMEOUT",
  Gone: "GONE",
  Conflict: "CONFLICT",
  UnprocessableEntity: "UNPROCESSABLE_ENTITY",
  UnsupportedMediaType: "UNSUPPORTED_MEDIA_TYPE",
  TooManyRequests: "TOO_MANY_REQUESTS",
  InternalServerError: "INTERNAL_SERVER_ERROR",
  NotImplemented: "NOT_IMPLEMENTED",
  BadGateway: "BAD_GATEWAY",
  BadRequest: "BAD_REQUEST",
  ServiceUnavailable: "SERVICE_UNAVAILABLE",
};

const status = {
  OK: 200,
  Created: 201,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  RequestTimeout: 408,
  Gone: 410,
  Conflict: 409,
  UnprocessableEntity: 422,
  UnsupportedMediaType: 415,
  TooManyRequests: 429,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
};

export { messages, status };
