import { useEffect, useRef, useState } from "react";
import { reverseGeocodeAddress, searchVietnameseAddresses } from "../services/addressSearchService";
import type { AddressSuggestion, DeliveryCoordinates } from "../types";

interface UseDeliveryAddressParams {
  address: string;
  setAddress: (address: string) => void;
}

export function useDeliveryAddress({ address, setAddress }: UseDeliveryAddressParams) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [coordinates, setCoordinates] = useState<DeliveryCoordinates | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const selectedAddressRef = useRef("");

  useEffect(() => {
    const query = address.trim();
    if (query === selectedAddressRef.current || query.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setCoordinates(null);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setAddressError(null);
      try {
        const results = await searchVietnameseAddresses(query, controller.signal);
        setSuggestions(results);
        setIsSuggestionOpen(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
          setAddressError("Không thể tải gợi ý địa chỉ. Vui lòng thử lại.");
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [address]);

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    selectedAddressRef.current = suggestion.label;
    setAddress(suggestion.label);
    setCoordinates({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    setSuggestions([]);
    setIsSuggestionOpen(false);
    setAddressError(null);
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setAddressError("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    setIsLocating(true);
    setAddressError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocodeAddress(
            position.coords.latitude,
            position.coords.longitude,
          );
          if (!result) throw new Error("Không tìm thấy địa chỉ");
          selectSuggestion({
            ...result,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } catch {
          setAddressError("Đã lấy được vị trí nhưng chưa xác định được địa chỉ.");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setAddressError("Không thể lấy vị trí. Hãy cấp quyền định vị và thử lại.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
    );
  };

  return {
    suggestions,
    coordinates,
    isSearching,
    isLocating,
    addressError,
    isSuggestionOpen,
    setIsSuggestionOpen,
    selectSuggestion,
    useCurrentLocation,
  };
}
